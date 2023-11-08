import { toU32, fromU32, U32Val, storageTypePersistent, fromSmallSymbolStr, toBool} from "as-soroban-sdk/lib/value";
import * as env from "as-soroban-sdk/lib/env";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = fromSmallSymbolStr("COUNTER");
  let counter = 0;

  // Get the current count.
  if (toBool(env.has_contract_data(key, storageTypePersistent))) {
    let dataObj = env.get_contract_data(key, storageTypePersistent)
    counter = toU32(dataObj);
  }

  // Increment the count.
  counter += 1;

  // Save the count.
  env.put_contract_data(key, fromU32(counter), storageTypePersistent)

  // Return the count to the caller.
  return env.get_contract_data(key, storageTypePersistent)
  
}