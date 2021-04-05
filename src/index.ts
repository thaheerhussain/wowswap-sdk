import JSBI from 'jsbi'

import { ChainId } from './constants'
export { JSBI }

export {
  BigintIsh,
  ChainId,
  TradeType,
  Rounding,
  FACTORY_ADDRESS,
  INIT_CODE_HASH,
  MINIMUM_LIQUIDITY
} from './constants'

export * from './errors'
export * from './entities'
export * from './router'
export * from './fetcher'

export const id = {
  _current: ChainId.MAINNET,
  setId: function(id: ChainId) {
    this._current = id
  },
  getId: function() {
    return this._current
  }
}
