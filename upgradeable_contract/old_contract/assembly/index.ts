import * as env from "as-soroban-sdk/lib/env";
import * as address from "as-soroban-sdk/lib/address";
import { AddressObject, BytesObject, fromVoid, VoidVal, U32Val, fromU32, storageTypeInstance} from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

export function init(admin: AddressObject): VoidVal {
    ledger.putDataFor("admin", admin, storageTypeInstance);
    return fromVoid();
}

export function version(): U32Val {
  return fromU32(1);
}

export function upgrade(new_wasm_hash: BytesObject): VoidVal {
  let admin = ledger.getDataFor("admin", storageTypeInstance);
  address.requireAuth(admin);

  return env.update_current_contract_wasm(new_wasm_hash);
}