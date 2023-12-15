import { AddressObject, VecObject, VoidVal, fromVoid} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";
import { i128ge, i128le} from "as-soroban-sdk/lib/val128";
import * as contract from "as-soroban-sdk/lib/contract";
import * as address from "as-soroban-sdk/lib/address";

//! This contract performs a batch of atomic token swaps between multiple
//! parties and does a simple price matching.
//! Parties don't need to know each other and also don't need to know their
//! signatures are used in this contract; they sign the `atomic swap` contract
//! invocation that guarantees that their token will be swapped with someone
//! while following the price limit.
//! This example demonstrates how authorized calls can be batched together.

enum DATA_INDEX {
  ADDRESS = 0,
  AMOUNT = 1,
  MIN_RECV = 2
}

/**
 * Swap token A for token B atomically between the parties that want to
 * swap A->B and parties that want to swap B->A.
 * All the parties should have authorized the `swap` via `swap_contract`,
 * but they don't need to authorize `multi_swap` itself.
 * @param swap_contract address of the atomic swap contract to be used.
 * @param token_a token A
 * @param token_b token B
 * @param swaps_a parties A { "vec": [
 *                                    { "vec": [{ "address": address}, { "i128": amount }, { "i128": min_recv }] }, 
 *                                    { "vec": [{ "address": address}, { "i128": amount }, { "i128": min_recv }] }, 
 *                                    ...
 *                                   ] 
 *                          }
 * @param swaps_a parties B { "vec": [
 *                                    { "vec": [{ "address": address}, { "i128": amount }, { "i128": min_recv }] }, 
 *                                    { "vec": [{ "address": address}, { "i128": amount }, { "i128": min_recv }] }, 
 *                                    ...
 *                                   ]
 *                          }
 * @returns void
 */
export function multi_swap(swap_contract: AddressObject, token_a: AddressObject, token_b: AddressObject, swaps_a: VecObject, swaps_b: VecObject): VoidVal {

  let swapsA = new Vec(swaps_a);
  let swapsB = new Vec(swaps_b);


  let i:u32 = 0;
  let j:u32 = 0;
  let countA = swapsA.len();

  for (; i < countA; i++) {
    let swapA = new Vec(swapsA.get(i));
    let addressA = swapA.get(DATA_INDEX.ADDRESS);
    let amountA = swapA.get(DATA_INDEX.AMOUNT);
    let minRecvA = swapA.get(DATA_INDEX.MIN_RECV);
    
    let swapsBClone = swapsB.slice(0, swapsB.len());
    let countB = swapsB.len();
    
    for (j = 0; j < countB; j++) {
      let swapB = new Vec(swapsBClone.get(j));
      let amountB = swapB.get(DATA_INDEX.AMOUNT);
      let minRecvB = swapB.get(DATA_INDEX.MIN_RECV);
      
      if (i128ge(amountA, minRecvB) && i128le(minRecvA, amountB)) {
        // As this is a simple 'batching' contract, there is no need
        // for all possible swaps to be fulfilled, hence we just want 
        // to demonstrate how authorized calls can be batched together.
        let addressB = swapB.get(DATA_INDEX.ADDRESS);
        let args = new Vec();
        args.pushBack(addressA);
        args.pushBack(addressB);
        args.pushBack(token_a);
        args.pushBack(token_b);
        args.pushBack(amountA);
        args.pushBack(minRecvA);
        args.pushBack(amountB);
        args.pushBack(minRecvB);

        let argsA = new Vec();
        argsA.pushBack(token_a);
        argsA.pushBack(token_b);
        argsA.pushBack(amountA);
        argsA.pushBack(minRecvA);
      
        address.requireAuthForArgs(addressA, argsA);
      
        let argsB = new Vec();
        argsB.pushBack(token_b);
        argsB.pushBack(token_a);
        argsB.pushBack(amountB);
        argsB.pushBack(minRecvB);
      
        address.requireAuthForArgs(addressB, argsB);

        contract.callContract(swap_contract, "swap", args);

        swapsB.del(j);
        break;
      }
    }
  }
  
  return fromVoid();
}
