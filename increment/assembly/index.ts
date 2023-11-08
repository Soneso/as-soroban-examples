import { toU32, fromU32, U32Val, storageTypePersistent} from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = "COUNTER";
  let counter = 0;

  // Get the current count.
  if (ledger.hasDataFor(key, storageTypePersistent)) {
    let dataObj = ledger.getDataFor(key, storageTypePersistent);
    counter = toU32(dataObj);
  }

  // Increment the count.
  counter += 1;

  // Save the count.
  ledger.putDataFor(key, fromU32(counter), storageTypePersistent);

  // Return the count to the caller.
  return ledger.getDataFor(key, storageTypePersistent);
  
}