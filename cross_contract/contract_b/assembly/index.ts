import * as val from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): val.RawVal {

  let contractId = "711bd03aebacf64fe819bb9412a2a8ac18cc657b1ce54542172c25e95979428c";
  let func = "add";
  let args = new Vec();
  args.push_back(val.fromI32(3));
  args.push_back(val.fromI32(12));

  return contract.call_by_id(contractId, func, args.getHostObject());
  
}