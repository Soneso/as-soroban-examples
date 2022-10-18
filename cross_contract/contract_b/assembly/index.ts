import * as val from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): val.RawVal {

  let contractId = "1f93b99bbd17a11ca22c05763b0c3296a7617af46835bb590105b2b154aefb18";
  let func = "add";
  let args = new Vec();
  args.push_back(val.fromI32(3));
  args.push_back(val.fromI32(12));

  return contract.call_by_id(contractId, func, args.getHostObject());

}