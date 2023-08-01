import {U32Val, fromU32, fromSmallSymbolStr, toU32, storageTypePersistent} from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import {Vec} from 'as-soroban-sdk/lib/vec';
import {publishEvent} from 'as-soroban-sdk/lib/context';

export function events(): U32Val {

  let key = "COUNTER";
  var counter = 0;
  if (ledger.hasDataFor(key, storageTypePersistent)) {
    let dataObj = ledger.getDataFor(key, storageTypePersistent);
    counter = toU32(dataObj);
  }
  counter += 1;
  ledger.putDataFor(key, fromU32(counter), storageTypePersistent, fromU32(0));
  
  // prepare and publish event
  let topics = new Vec();
  topics.pushBack(fromSmallSymbolStr(key));
  topics.pushBack(fromSmallSymbolStr("increment"));
  publishEvent(topics, fromU32(counter));

  return ledger.getDataFor(key, storageTypePersistent);
}