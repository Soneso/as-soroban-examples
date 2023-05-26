import { I32Val, fromI32 } from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): I32Val {

  let contractId = "e6dd1c7617ec7b64ed91f444b6eaa46df751c7782a9d7697954decdf271a41ce";
  let func = "add";
  let args = new Vec();
  args.pushBack(fromI32(3));
  args.pushBack(fromI32(12));

  return contract.callContractById(contractId, func, args.getHostObject());

}