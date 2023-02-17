import * as val from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): val.RawVal {

  let contractId = "4014747356d8a39399d6d43609504f0f18c6a127fcaa6fdddcdfa3986bd65058";
  let func = "add";
  let args = new Vec();
  args.pushBack(val.fromI32(3));
  args.pushBack(val.fromI32(12));

  return contract.callContractById(contractId, func, args.getHostObject());

}