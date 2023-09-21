import { toU32, fromU32, U32Val, storageTypePersistent, fromVoid } from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

export function increment(): U32Val {

  let key = "COUNTER";
  let counter = 0;
  if (ledger.hasDataFor(key, storageTypePersistent)) {
    let dataObj = ledger.getDataFor(key, storageTypePersistent);
    counter = toU32(dataObj);
  }
  counter += 1;
  ledger.putDataFor(key, fromU32(counter), storageTypePersistent);
  return ledger.getDataFor(key, storageTypePersistent);

}