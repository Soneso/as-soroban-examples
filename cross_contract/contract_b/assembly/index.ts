import { I32Val, fromI32 } from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): I32Val {

  let contractId = "9b116b40b2e409bba868455348fb65b9120894ded72b9e42442c067b1cb7294d";
  let func = "add";
  let args = new Vec();
  args.pushBack(fromI32(3));
  args.pushBack(fromI32(12));
  return contract.callContractById(contractId, func, args.getHostObject());

}