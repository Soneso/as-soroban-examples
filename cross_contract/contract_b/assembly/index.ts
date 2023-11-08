import { AddressObject, I32Val, fromI32 } from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(addr: AddressObject): I32Val {

  let func = "add";
  let args = new Vec();
  args.pushBack(fromI32(3));
  args.pushBack(fromI32(12));
  
  return contract.callContract(addr, func, args);
}