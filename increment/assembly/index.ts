import * as val from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";

export function increment(): val.RawVal {

  let key = "COUNTER";
  var counter = 0;
  if (ledger.has_data_for(key)) {
    let dataObj = ledger.get_data_for(key);
    counter = val.toU32(dataObj);
  }
  counter += 1;
  let counterObj = val.fromU32(counter);
  ledger.put_data_for(key, counterObj);
  return counterObj;
}