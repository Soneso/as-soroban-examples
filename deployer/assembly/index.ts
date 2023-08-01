import {BytesObject, I32Val, SmallSymbolVal, VecObject} from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import * as contract from "as-soroban-sdk/lib/contract";
import * as context from "as-soroban-sdk/lib/context";

export function deploy(wasm_hash: BytesObject, salt: BytesObject, 
                      fn_name: SmallSymbolVal, args:VecObject): I32Val {

  let currentContractAddress = context.getCurrentContractAddress();
  let id = ledger.deployContract(currentContractAddress, wasm_hash, salt);
  return contract.callContract(id, fn_name, args);
}
