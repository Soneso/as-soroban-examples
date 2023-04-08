import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import * as contract from "as-soroban-sdk/lib/contract";
import {AddressObject, BytesObject, I128Object, fromSmallSymbolStr, RawVal, fromVoid, isI128Small, toI128Small, isI128, fromI128Pieces} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";
import { Sym } from "as-soroban-sdk/lib/sym";

enum SWAP_ERR_CODES {
  NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A = 1,
  NOT_ENOUGH_TOKEN_A_FOR_TOKEN_B = 2,
}

// Swap token A for token B atomically. Settle for the minimum requested price
// for each party (this is an arbitrary choice to demonstrate the usage of
// allowance; full amounts could be swapped as well).

/**
 * Swaps token A for token B atomically.
 * @param {AddressObject} a The Address holding token a.
 * @param {AddressObject} b The Address holding token b.
 * @param {BytesObject} token_a The contract id representing token a.
 * @param {BytesObject} token_b The contract id representing token b.
 * @param {I128Object} amount_a The amount of token a offered.
 * @param {I128Object} min_b_for_a The min amount of token b requested for the amount of token a offered.
 * @param {I128Object} amount_b The amount of token b offered.
 * @param {I128Object} min_a_for_b The min amount of token a requested for the amount of token b offered.
 * @returns {RawVal} void. Traps on error.
 */
export function swap(a: AddressObject, b: AddressObject, 
  token_a: BytesObject, token_b: BytesObject, 
  amount_a: I128Object, min_b_for_a: I128Object, 
  amount_b: I128Object, min_a_for_b: I128Object): RawVal {
  

  // Verify preconditions on the minimum price for both parties.
  if (compareAmounts(amount_b, min_b_for_a) == -1) { // amount_b < min_b_for_a 
    context.failWithErrorCode(SWAP_ERR_CODES.NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A);
  }

  if (compareAmounts(amount_a, min_a_for_b) == -1) { // amount_a < min_a_for_b 
    context.failWithErrorCode(SWAP_ERR_CODES.NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A);
  }

  // Require authorization for a subset of arguments specific to a party.
  // Notice, that arguments are symmetric - there is no difference between
  // `a` and `b` in the call and hence their signatures can be used
  // either for `a` or for `b` role.

  let argsA = new Vec();
  argsA.pushBack(token_a);
  argsA.pushBack(token_b);
  argsA.pushBack(amount_a);
  argsA.pushBack(min_b_for_a);

  address.requireAuthForArgs(a, argsA);

  let argsB = new Vec();
  argsB.pushBack(token_b);
  argsB.pushBack(token_a);
  argsB.pushBack(amount_b);
  argsB.pushBack(min_a_for_b);

  address.requireAuthForArgs(b, argsB);
 
  // Perform the swap via two token transfers.
  move_token(token_a, a, b, amount_a, min_a_for_b);
  move_token(token_b, b, a, amount_b, min_b_for_a);
 
  return fromVoid();

}

function move_token(token: BytesObject, from: AddressObject, to:AddressObject, 
  approve_amount:I128Object, xfer_amount:I128Object): void {
  
  let contract_address =  context.getCurrentContractAddress();

  // This call needs to be authorized by `from` address. Since it increases
  // the allowance on behalf of the contract, `from` doesn't need to know `to`
  // at the signature time.

  let incrArgs = new Vec();
  incrArgs.pushBack(from);
  incrArgs.pushBack(contract_address);
  incrArgs.pushBack(approve_amount);
  let func = Sym.fromSymbolString("incr_allow").getHostObject(); // "incr_allow" has more than 9 chars.
  contract.callContract(token, func, incrArgs.getHostObject());

  let xferArgs = new Vec();
  xferArgs.pushBack(contract_address);
  xferArgs.pushBack(from);
  xferArgs.pushBack(to);
  xferArgs.pushBack(xfer_amount);
  contract.callContract(token, fromSmallSymbolStr("xfer_from"), xferArgs.getHostObject());

}

function compareAmounts(a: RawVal, b: RawVal): i64 {
  
  if (isI128Small(a) && isI128Small(b)) {
    let a_val = toI128Small(a);
    let b_val = toI128Small(b);
    return a_val < b_val ? -1 : (a_val > b_val ? 1 : 0);
  } 

  let a_obj = isI128(a) ? a : fromI128Pieces(toI128Small(a), 0);
  let b_obj = isI128(b) ? b : fromI128Pieces(toI128Small(b), 0);
  return context.compareObj(a_obj, b_obj);
}