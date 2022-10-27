import * as val from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callAuth(): val.RawVal {

  let contractId = "45a5e4697fcd38ec0654ea477a751ccc9b6d8eaa45d8c848678a87c02a43db53";
  let func = "auth";
  let args = new Vec();

  return contract.callContractById(contractId, func, args.getHostObject());

}