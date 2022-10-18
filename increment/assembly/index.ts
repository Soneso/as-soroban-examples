import { RawVal, toU32, fromU32 } from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

export function increment(): RawVal {

  let key = "COUNTER";
  var counter = 0;
  if (ledger.has_data_for(key)) {
    let dataObj = ledger.get_data_for(key);
    counter = toU32(dataObj);
  }
  counter += 1;
  ledger.put_data_for(key, fromU32(counter));
  return ledger.get_data_for(key);
  
}