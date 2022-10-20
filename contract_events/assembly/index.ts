import {RawVal, fromU32, fromSymbolStr, toU32} from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import {Vec} from 'as-soroban-sdk/lib/vec';
import {publishEvent} from 'as-soroban-sdk/lib/context';

export function events(): RawVal {

  let key = "COUNTER";
  var counter = 0;
  if (ledger.hasDataFor(key)) {
    let dataObj = ledger.getDataFor(key);
    counter = toU32(dataObj);
  }
  counter += 1;
  ledger.putDataFor(key, fromU32(counter));
  
  // prepare and publish event
  let topics = new Vec();
  topics.pushBack(fromSymbolStr(key));
  topics.pushBack(fromSymbolStr("increment"));
  publishEvent(topics, fromU32(counter));

  return ledger.getDataFor(key);

}