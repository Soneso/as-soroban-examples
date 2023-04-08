import {BytesObject, I32Val, RawVal, SmallSymbolVal, VecObject} from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import * as contract from "as-soroban-sdk/lib/contract";

export function deploy(wasm_hash: BytesObject, salt: BytesObject, 
                      fn_name: SmallSymbolVal, args:VecObject): I32Val {

  let id = ledger.deployContract(wasm_hash, salt);
  return contract.callContract(id, fn_name, args);
}
