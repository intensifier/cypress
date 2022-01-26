const { startDevServer } = require('@cypress/webpack-dev-server')
const { createWebpackDevConfig } = require('@craco/craco')
const { getLegacyDevServer } = require('../utils/legacy-setup-dev-server')

function devServer (cypressDevServerConfig, cracoConfig, indexHtml) {
  process.env.FAST_REFRESH = 'false'

  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: createWebpackDevConfig(cracoConfig),
    indexHtml,
  })
}

// Legacy signature
module.exports = getLegacyDevServer(devServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
// - Note that this also includes a change to the second argument!
module.exports.devServer = (cypressDevServerConfig, { cracoConfig, indexHtml }) => {
  return devServer(cypressDevServerConfig, cracoConfig, indexHtml)
}