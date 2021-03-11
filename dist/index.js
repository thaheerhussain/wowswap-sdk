
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./wowswap-sdk.cjs.production.min.js')
} else {
  module.exports = require('./wowswap-sdk.cjs.development.js')
}
