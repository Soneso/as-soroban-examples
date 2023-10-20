import {U32Val, fromU32, fromSmallSymbolStr, toU32, storageTypePersistent} from 'as-soroban-sdk/lib/value';
import * as env from "as-soroban-sdk/lib/env";
import {Vec} from 'as-soroban-sdk/lib/vec';
import {publishEvent} from 'as-soroban-sdk/lib/context';

export function events(): U32Val {

  let key = fromSmallSymbolStr("COUNTER");
  let counter:u32 = 0;
  if (env.has_contract_data(key, storageTypePersistent)) {
    let dataObj = env.get_contract_data(key, storageTypePersistent)
    counter = toU32(dataObj);
  }
  counter += 1;
  
  let counterHostValue = fromU32(counter);

  env.put_contract_data(key, counterHostValue, storageTypePersistent)
  
  // prepare and publish event
  let topics = new Vec();
  topics.pushBack(key);
  topics.pushBack(fromSmallSymbolStr("increment"));
  publishEvent(topics, counterHostValue);

  return counterHostValue;
}