import { TestingType, MIGRATION_STEPS } from '@packages/types'
import Debug from 'debug'
import type chokidar from 'chokidar'
import path from 'path'
import type { DataContext } from '..'
import {
  createConfigString,
  initComponentTestingMigration,
  ComponentTestingMigrationStatus,
  getSpecs,
  getDefaultLegacySupportFile,
  RelativeSpecWithTestingType,
  supportFilesForMigration,
  OldCypressConfig,
  hasComponentSpecFile,
  getSpecsForMigrationGuide,
} from '../util/migration'
import type { FilePart } from '../util/migrationFormat'
import {
  getStepsForMigration,
  shouldShowRenameSupport,
  getIntegrationFolder,
  isDefaultTestFiles,
  getComponentTestFiles,
  getComponentFolder,
} from './migration/shouldShowSteps'

const debug = Debug('cypress:data-context:MigrationDataSource')

export interface MigrationFile {
  testingType: TestingType
  relative: string
  parts: FilePart[]
}

export interface MigrationRelativeSpecs {
  before: RelativeSpecWithTestingType
}

export interface FilesForMigrationUI {
  before: MigrationFile[]
  after: MigrationFile[]
}

type MIGRATION_STEP = typeof MIGRATION_STEPS[number]

export class MigrationDataSource {
  private _config: OldCypressConfig | null = null
  private _step: MIGRATION_STEP = 'renameAuto'
  filteredSteps: MIGRATION_STEP[] = MIGRATION_STEPS.filter(() => true)

  hasCustomIntegrationFolder: boolean = false
  hasCustomIntegrationTestFiles: boolean = false

  hasCustomComponentFolder: boolean = false
  hasCustomComponentTestFiles: boolean = false

  hasCustomSupportFile = false
  hasComponentTesting: boolean = true

  private componentTestingMigrationWatcher?: chokidar.FSWatcher
  componentTestingMigrationStatus?: ComponentTestingMigrationStatus

  constructor (private ctx: DataContext) { }

  async initialize () {
    if (!this.ctx.currentProject) {
      throw Error('cannot do migration without currentProject!')
    }

    this._config = null
    const config = await this.parseCypressConfig()

    await this.initializeFlags()

    this.filteredSteps = await getStepsForMigration(this.ctx.currentProject, config)

    if (!this.filteredSteps[0]) {
      throw Error(`Impossible to initialize a migration. No steps fit the configuration of this project.`)
    }

    this.setStep(this.filteredSteps[0])
  }

  async getSpecsRelativeToFolder () {
    if (!this.ctx.currentProject) {
      throw Error('cannot get specs without a project path')
    }

    const intFolder = await this.integrationFolder()

    const specs = await getSpecs(this.ctx.currentProject, intFolder || null)

    debug('looked in %s and %s and found %o', intFolder, specs)

    return specs
  }

  async getDefaultLegacySupportFile (): Promise<string> {
    if (!this.ctx.currentProject) {
      throw Error(`Need this.ctx.projectRoot!`)
    }

    return getDefaultLegacySupportFile(this.ctx.currentProject)
  }

  async getComponentTestingMigrationStatus () {
    const config = await this.parseCypressConfig()
    const componentFolder = getComponentFolder(config)

    if (!config || !this.ctx.currentProject) {
      throw Error('Need currentProject and config to continue')
    }

    // no component folder, so no specs to migrate
    // this should never happen since we never show the
    // component specs migration step ("renameManual")
    if (componentFolder === false) {
      return null
    }

    if (!this.componentTestingMigrationWatcher) {
      const onFileMoved = (status: ComponentTestingMigrationStatus) => {
        this.componentTestingMigrationStatus = status

        if (status.completed) {
          this.componentTestingMigrationWatcher?.close()
        }

        // TODO(lachlan): is this the right plcae to use the emitter?
        this.ctx.deref.emitter.toLaunchpad()
      }

      const { status, watcher } = await initComponentTestingMigration(
        this.ctx.currentProject,
        componentFolder,
        getComponentTestFiles(config),
        onFileMoved,
      )

      this.componentTestingMigrationStatus = status
      this.componentTestingMigrationWatcher = watcher
    }

    if (!this.componentTestingMigrationStatus) {
      throw Error(`Status should have been assigned by the watcher. Somethign is wrong`)
    }

    return this.componentTestingMigrationStatus
  }

  async supportFilesForMigrationGuide (): Promise<FilesForMigrationUI | null> {
    const config = await this.parseCypressConfig()

    if (!shouldShowRenameSupport(config)) {
      return null
    }

    if (!this.ctx.currentProject) {
      throw Error(`Need this.ctx.projectRoot!`)
    }

    return supportFilesForMigration(this.ctx.currentProject)
  }

  async getSpecsForMigrationGuide (): Promise<FilesForMigrationUI> {
    const integrationFolder = await this.integrationFolder()

    if (integrationFolder === false) {
      return {
        before: [],
        after: [],
      }
    }

    const specs = await this.getSpecsRelativeToFolder()

    return getSpecsForMigrationGuide(specs, integrationFolder)
  }

  async getConfig () {
    const config = await this.parseCypressConfig()

    return JSON.stringify(config, null, 2)
  }

  async createConfigString () {
    const config = await this.parseCypressConfig()

    return createConfigString(config)
  }

  async integrationFolder () {
    const config = await this.parseCypressConfig()

    return getIntegrationFolder(config)
  }

  async componentFolder () {
    const config = await this.parseCypressConfig()

    return getComponentFolder(config)
  }

  private async parseCypressConfig (): Promise<OldCypressConfig> {
    if (this._config) {
      return this._config
    }

    if (this.ctx.lifecycleManager.metaState.hasLegacyCypressJson) {
      const cfgPath = path.join(this.ctx.lifecycleManager?.projectRoot, 'cypress.json')

      this._config = await this.ctx.file.readJsonFile(cfgPath) as OldCypressConfig

      return this._config
    }

    return {}
  }

  private async initializeFlags () {
    if (!this.ctx.currentProject) {
      throw Error('Need currentProject to do migration')
    }

    const config = await this.parseCypressConfig()

    this.hasCustomIntegrationTestFiles = !isDefaultTestFiles(config, 'integration')
    this.hasCustomIntegrationFolder = getIntegrationFolder(config) !== 'cypress/integration'

    const componentFolder = getComponentFolder(config)

    this.hasCustomComponentFolder = componentFolder !== 'cypress/component'

    const componentTestFiles = getComponentTestFiles(config)

    this.hasCustomComponentTestFiles = !isDefaultTestFiles(config, 'component')

    if (componentFolder === false) {
      this.hasComponentTesting = false
    } else {
      this.hasComponentTesting = await hasComponentSpecFile(
        this.ctx.currentProject,
        componentFolder,
        componentTestFiles,
      )
    }
  }

  get step (): MIGRATION_STEP {
    return this._step
  }

  setStep (step: MIGRATION_STEP) {
    this._step = step
  }
}
