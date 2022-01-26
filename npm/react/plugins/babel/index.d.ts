import { Configuration } from "webpack";

declare namespace legacyDevServer {
  interface CypressBabelDevServerConfig {
    /**
     * Allows to adjust the webpackConfig that our dev-server will use
     * @param config configuration generated by the plugin
     * @returns modified final configuration
     */
    setWebpackConfig?(config:Configuration): Configuration

    /**
     * Path to an index.html file that will serve as the template in
     * which your components will be rendered.
     */
    indexHtml?: string
  }

  /**
   * Sets up a webpack dev server with the proper configuration for babel transpilation
   * @param cypressDevServerConfig comes from the `devServer()` function first argument
   * @param devServerConfig additional config object (create an empty object to see how to use it)
   * @returns the resolved dev server object that cypress can use to start testing
   */
  function devServer(cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressBabelDevServerConfig): Cypress.ResolvedDevServerConfig
}

/**
 * Setup a webpack dev server with the proper configuration for babel transpilation
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param devServerConfig additional config object (create an empty object it to see how to use it)
 */
declare function legacyDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, devServerConfig?: legacyDevServer.CypressBabelDevServerConfig): void

export = legacyDevServer;