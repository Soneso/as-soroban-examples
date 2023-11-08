import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
//import * as contract from "as-soroban-sdk/lib/contract";
import * as env from "as-soroban-sdk/lib/env";
import {AddressObject, I128Val, fromVoid, VoidVal, fromSmallSymbolStr} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";
import { i128lt, i128sub } from "as-soroban-sdk/lib/val128";

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
 * @param {AddressObject} token_a The contract address representing token a.
 * @param {AddressObject} token_b The contract address representing token b.
 * @param {I128Val} amount_a The amount of token a offered.
 * @param {I128Val} min_b_for_a The min amount of token b requested for the amount of token a offered.
 * @param {I128Val} amount_b The amount of token b offered.
 * @param {I128Val} min_a_for_b The min amount of token a requested for the amount of token b offered.
 * @returns {VoidVal} void. Traps on error.
 */
export function swap(a: AddressObject, b: AddressObject, 
  token_a: AddressObject, token_b: AddressObject, 
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

function move_token(token: AddressObject, from: AddressObject, to:AddressObject, 
  max_spend_amount:I128Val, transfer_amount:I128Val): void {
  
  let contract_address =  context.getCurrentContractAddress();

  // This call needs to be authorized by `from` address. It transfers the
  // maximum spend amount to the swap contract's address in order to decouple
  // the signature from `to` address (so that parties don't need to know each
  // other).

  let func = fromSmallSymbolStr("transfer");

  let t1Args = new Vec();
  t1Args.pushBack(from);
  t1Args.pushBack(contract_address);
  t1Args.pushBack(max_spend_amount);
  env.call(token, func, t1Args.getHostObject());

  // Transfer the necessary amount to `to`.
  let t2Args = new Vec();
  t2Args.pushBack(contract_address);
  t2Args.pushBack(to);
  t2Args.pushBack(transfer_amount);
  env.call(token, func, t2Args.getHostObject());

  // Refund the remaining balance to `from`.
  let t3Args = new Vec();
  t3Args.pushBack(contract_address);
  t3Args.pushBack(from);
  t3Args.pushBack(i128sub(max_spend_amount,transfer_amount));
  env.call(token, func, t3Args.getHostObject());
}