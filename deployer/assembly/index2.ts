import { BytesObject, I32Val, fromI32 } from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import * as contract from "as-soroban-sdk/lib/contract";
import * as context from "as-soroban-sdk/lib/context";
import { Bytes } from 'as-soroban-sdk/lib/bytes';
import { Vec } from 'as-soroban-sdk/lib/vec';

export function deploy2(wasm_hash: BytesObject): I32Val {

  let currentContractAddress = context.getCurrentContractAddress();

  // use SDK type "Bytes" and wrapped function
  let wasmHashBytes = new Bytes(wasm_hash);
  let pseudoSaltBytes = new Bytes();
  for (let i: u32 = 0; i < 32; i++) {
    pseudoSaltBytes.push(i);
  }

  let id = ledger.deployContract(currentContractAddress, wasmHashBytes, pseudoSaltBytes);

    // use string, the SDK type "Vec" and wrapped function
  let argsVec = new Vec();
  argsVec.pushBack(fromI32(7));
  argsVec.pushBack(fromI32(3));
  return contract.callContract(id, "add", argsVec);

}