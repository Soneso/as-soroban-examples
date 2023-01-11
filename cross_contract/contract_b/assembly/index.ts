import * as val from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): val.RawVal {

  let contractId = "9a1268dd7745bea291bdc79ad38d6dd34d193088ae83931a3569fd6de7d25db7";
  let func = "add";
  let args = new Vec();
  args.pushBack(val.fromI32(3));
  args.pushBack(val.fromI32(12));

  return contract.callContractById(contractId, func, args.getHostObject());

}