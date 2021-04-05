import { TradeType } from './constants'
import invariant from 'tiny-invariant'
import { validateAndParseAddress } from './utils'
import { CurrencyAmount, ETHER, Percent, Trade } from './entities'

/**
 * Options for producing the arguments to send call to the router.
 */
export interface TradeOptions {
  /**
   * How much the execution price is allowed to move unfavorably from the trade execution price.
   */
  allowedSlippage: Percent
  /**
   * How long the swap is valid until it expires, in seconds.
   * This will be used to produce a `deadline` parameter which is computed from when the swap call parameters
   * are generated.
   */
  ttl: number
  /**
   * The account that should receive the output of the swap.
   */
  recipient: string

  /**
   * Whether any of the tokens in the path are fee on transfer tokens, which should be handled with special methods
   */
  feeOnTransfer?: boolean

  /**
   * Leverage Margin Factor
   */
  leverageFactor?: number

  /**
   * Set is open or close position
   */
  isOpenPosition: boolean

  tradeble: string
  lendable?: string
}

/**
 * The parameters to use in the call to the Uniswap V2 Router to execute a trade.
 */
export interface SwapParameters {
  /**
   * The method to call on the Uniswap V2 Router.
   */
  methodName: string
  /**
   * The arguments to pass to the method, all hex encoded.
   */
  args: (string | string[])[]
  /**
   * The amount of wei to send in hex.
   */
  value: string
}

function toHex(currencyAmount: CurrencyAmount) {
  return `0x${currencyAmount.raw.toString(16)}`
}

const ZERO_HEX = '0x0'

/**
 * Represents the Uniswap V2 Router, and has static methods for helping execute trades.
 */
export abstract class Router {
  /**
   * Cannot be constructed.
   */
  private constructor() {}
  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static swapCallParameters(trade: Trade, options: TradeOptions): SwapParameters {
    const etherIn = trade.inputAmount.currency === ETHER
    const etherOut = trade.outputAmount.currency === ETHER
    // the router does not support both ether in and out
    invariant(!(etherIn && etherOut), 'ETHER_IN_OUT')
    invariant(options.ttl > 0, 'TTL')

    const trader: string = validateAndParseAddress(options.recipient)
    const amountIn: string = toHex(trade.maximumAmountIn(options.allowedSlippage))
    // const amountOut: string = toHex(trade.minimumAmountOut(options.allowedSlippage))
    // const path: string[] = trade.route.path.map(token => token.address)
    const deadline = `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
    // const useFeeOnTransfer = Boolean(options.feeOnTransfer)

    console.log('--------------------- SwapParameters')
    console.log('+++++++++++++++++++++ trade')
    console.log(trade)
    console.log('+++++++++++++++++++++ options')
    console.log(options)

    const leverageFactor = `0x${(options.leverageFactor || 1).toString(16)}`
    const { isOpenPosition, lendable, tradeble } = options

    let methodName: string
    let args: (string | string[])[]
    let value: string
    switch (trade.tradeType) {
      case TradeType.EXACT_INPUT:
        if (etherIn) {
          methodName = 'openPositionETH'
          args = [leverageFactor, '0x0', tradeble, trader, deadline]
          value = amountIn
        } else if (etherOut) {
          methodName = 'closePositionETH'
          args = [trader, amountIn, tradeble, deadline]
          value = ZERO_HEX
        } else if (isOpenPosition) {
          if (!lendable) {
            throw new Error('Lendable is required for this transaction')
          }
          methodName = 'openPosition'
          args = [trader, amountIn, lendable, tradeble, leverageFactor, deadline]
          value = ZERO_HEX
        } else {
          methodName = 'closePosition'
          args = [trader, amountIn, tradeble, deadline]
          value = ZERO_HEX
        }
        break
      case TradeType.EXACT_OUTPUT:
        throw new Error('Unsupported method')
    }
    console.log('--=-=-=-=-=-=-=-=-=-=-=-= Results  ')
    console.log({
      methodName,
      args,
      value
    })
    return {
      methodName,
      args,
      value
    }
  }
}
