import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import * as contract from "as-soroban-sdk/lib/contract";
import {AddressObject, BytesObject, I128Val, fromSmallSymbolStr, fromVoid, VoidVal} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";
import { Sym } from "as-soroban-sdk/lib/sym";
import { i128lt } from "as-soroban-sdk/lib/val128";

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
 * @param {I128Val} amount_a The amount of token a offered.
 * @param {I128Val} min_b_for_a The min amount of token b requested for the amount of token a offered.
 * @param {I128Val} amount_b The amount of token b offered.
 * @param {I128Val} min_a_for_b The min amount of token a requested for the amount of token b offered.
 * @returns {VoidVal} void. Traps on error.
 */
export function swap(a: AddressObject, b: AddressObject, 
  token_a: BytesObject, token_b: BytesObject, 
  amount_a: I128Val, min_b_for_a: I128Val, 
  amount_b: I128Val, min_a_for_b: I128Val): VoidVal {
  

  // Verify preconditions on the minimum price for both parties.
  if (i128lt(amount_b, min_b_for_a)) { // amount_b < min_b_for_a
    context.failWithErrorCode(SWAP_ERR_CODES.NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A);
  }

  if (i128lt(amount_a, min_a_for_b)) { // amount_a < min_a_for_b 
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
  approve_amount:I128Val, xfer_amount:I128Val): void {
  
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