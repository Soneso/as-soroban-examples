import { toU32, fromU32, U32Val, storageTypeInstance} from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = "COUNTER";
  let counter = 0;

  // Get the current count.
  if (ledger.hasDataFor(key, storageTypeInstance)) {
    let dataHostValue = ledger.getDataFor(key, storageTypeInstance);
    counter = toU32(dataHostValue);
  }

  // Increment the count.
  counter += 1;

  // Save the count.
  ledger.putDataFor(key, fromU32(counter), storageTypeInstance);

  // The contract instance will be bumped to have a lifetime of at least 100 ledgers if the current expiration lifetime at most 50.
  // If the lifetime is already more than 100 ledgers, this is a no-op. Otherwise,
  // the lifetime is extended to 100 ledgers. This lifetime bump includes the contract
  // instance itself and all entries of storageTypeInstance, i.e, COUNTER.
  ledger.bumpCurrentContractInstanceAndCode(50, 100);

  // Return the count to the caller.
  return ledger.getDataFor(key, storageTypeInstance);

}