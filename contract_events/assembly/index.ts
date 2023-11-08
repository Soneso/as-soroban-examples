import {U32Val, fromU32, fromSmallSymbolStr, toU32, storageTypePersistent} from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import {Vec} from 'as-soroban-sdk/lib/vec';
import * as context from "as-soroban-sdk/lib/context";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = fromSmallSymbolStr("COUNTER");
  let counter:u32 = 0;

  // Get the current count.
  if (ledger.hasData(key, storageTypePersistent)) {
    let dataObj = ledger.getData(key, storageTypePersistent);
    counter = toU32(dataObj);
  }

  // Increment the count.
  counter += 1;
  
  // Save the count.
  let counterHostValue = fromU32(counter);
  ledger.putData(key, counterHostValue, storageTypePersistent);

  // Publish an event about the increment occuring.
  // The event has two topics:
  //   - The "COUNTER" symbol.
  //   - The "increment" symbol.
  // The event data is the count.
  let topics = new Vec();
  topics.pushBack(key);
  topics.pushBack(fromSmallSymbolStr("increment"));
  context.publishEvent(topics, counterHostValue);

  // Return the count to the caller.
  return counterHostValue;
}