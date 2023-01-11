import * as val from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callAuth(): val.RawVal {

  let contractId = "a593b4630c4a58ee79e6f9ec9cda422abae51552d327042b4e857e5df5dbf21e";
  let func = "auth";
  let args = new Vec();

  return contract.callContractById(contractId, func, args.getHostObject());

}