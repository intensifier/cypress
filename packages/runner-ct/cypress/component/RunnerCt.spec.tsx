/// <reference types="@percy/cypress" />
/// <reference types="cypress-real-events" />
import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import '@packages/runner/src/main.scss'
import { makeState, fakeConfig } from './utils'
import { EventManager } from '@packages/runner-shared'
import State from '../../src/lib/state'

const selectors = {
  reporter: '[data-cy=reporter]',
  noSpecSelectedReporter: '[data-cy=no-spec-selected-reporter]',
  specsList: '[data-cy=specs-list]',
  searchInput: 'input[placeholder="Find spec..."]',
}

const mountRunnerCt = (state: State = makeState(), config = fakeConfig) => {
  const eventManager = new EventManager()

  return mount(
    <RunnerCt
      state={state}
      eventManager={eventManager}
      // @ts-ignore
      config={config}
    />,
  )
}

describe('RunnerCt', () => {
  beforeEach(() => {
    cy.viewport(1000, 500)
  })

  it('renders RunnerCt', () => {
    cy.percySnapshot()
  })

  it('renders RunnerCt for video recording', () => {
    mountRunnerCt(makeState(), { ...fakeConfig, isTextTerminal: true })

    cy.percySnapshot()
  })

  it('shows hint message if no component specs', () => {
    mountRunnerCt(makeState({ specs: [] }), { ...fakeConfig, projectRoot: '/root', componentFolder: '/root/src' })
    cy.contains('No specs found')
    cy.percySnapshot()
  })

  context('keyboard shortcuts', () => {
    it('toggles specs list drawer using shortcut', () => {
      const eventManager = new EventManager()
      const saveState = cy.spy(eventManager, 'saveState')

      mount(
        <RunnerCt
          state={makeState()}
          eventManager={eventManager}
          config={fakeConfig}
        />,
      )

      cy.window().then((win) => win.focus())
      cy.get(selectors.specsList).should('be.visible')

      cy.realPress(['Meta', 'B'])
      cy.get(selectors.specsList).should('not.be.visible').then(() => {
        expect(saveState).to.have.been.calledWith({ ctIsSpecsListOpen: false })
      })

      cy.realPress(['Meta', 'B'])
      cy.get(selectors.specsList).should('be.visible').then(() => {
        expect(saveState).to.have.been.calledWith({ ctIsSpecsListOpen: false }),
        expect(saveState).to.have.been.calledWith({ ctIsSpecsListOpen: true })
      })
    })

    it('focuses the search field on "/"', () => {
      mountRunnerCt()
      cy.realPress('/')
      cy.get(selectors.searchInput).should('be.focused')
    })
  })

  context('no spec selected', () => {
    it('hides reporter', () => {
      mountRunnerCt(makeState({ spec: null }))
      cy.get(selectors.noSpecSelectedReporter).should('exist')
    })
  })
})
