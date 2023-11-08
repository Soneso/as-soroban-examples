import {BytesObject, I32Val, SmallSymbolVal, VecObject} from 'as-soroban-sdk/lib/value';
import * as env from "as-soroban-sdk/lib/env";

export function deploy(wasm_hash: BytesObject, salt: BytesObject, 
                      fn_name: SmallSymbolVal, args:VecObject): I32Val {

  let currentContractAddress = env.get_current_contract_address();
  let id = env.create_contract(currentContractAddress, wasm_hash, salt);
  return env.call(id, fn_name, args);
}
