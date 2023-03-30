import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import * as contract from "as-soroban-sdk/lib/contract";
import {AddressObject, BytesObject, Signed128BitIntObject, fromSymbolStr, RawVal, fromVoid} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";

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
 * @param {Signed128BitIntObject} amount_a The amount of token a offered.
 * @param {Signed128BitIntObject} min_b_for_a The min amount of token b requested for the amount of token a offered.
 * @param {Signed128BitIntObject} amount_b The amount of token b offered.
 * @param {Signed128BitIntObject} min_a_for_b The min amount of token a requested for the amount of token b offered.
 * @returns {RawVal} void. Traps on error.
 */
export function swap(a: AddressObject, b: AddressObject, 
  token_a: BytesObject, token_b: BytesObject, 
  amount_a: Signed128BitIntObject, min_b_for_a: Signed128BitIntObject, 
  amount_b: Signed128BitIntObject, min_a_for_b: Signed128BitIntObject): RawVal {
  

  // Verify preconditions on the minimum price for both parties.
  if (context.compare(amount_b, min_b_for_a) == -1) { // amount_b < min_b_for_a 
    context.failWithErrorCode(SWAP_ERR_CODES.NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A);
  }

  if (context.compare(amount_a, min_a_for_b) == -1) { // amount_a < min_a_for_b 
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

export function move_token(token: BytesObject, from: AddressObject, to:AddressObject, 
  approve_amount:Signed128BitIntObject, xfer_amount:Signed128BitIntObject): void {
  
  let contract_address =  context.getCurrentContractAddress();

  // This call needs to be authorized by `from` address. Since it increases
  // the allowance on behalf of the contract, `from` doesn't need to know `to`
  // at the signature time.

  let incrArgs = new Vec();
  incrArgs.pushBack(from);
  incrArgs.pushBack(contract_address);
  incrArgs.pushBack(approve_amount);
  contract.callContract(token, fromSymbolStr("incr_allow"), incrArgs.getHostObject());

  let xferArgs = new Vec();
  xferArgs.pushBack(contract_address);
  xferArgs.pushBack(from);
  xferArgs.pushBack(to);
  xferArgs.pushBack(xfer_amount);
  contract.callContract(token, fromSymbolStr("xfer_from"), xferArgs.getHostObject());

}