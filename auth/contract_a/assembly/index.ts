import {RawVal, fromU32, toU32} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';
import * as ledger from 'as-soroban-sdk/lib/ledger';
import * as context from 'as-soroban-sdk/lib/context';

export function auth(): RawVal {

  let key = context.getInvokerType() == 0 ? context.getInvokingAccount() : context.getInvokingContract();
  var counter = 0;
  if (ledger.hasData(key)) {
    let dataObj = ledger.getData(key);
    counter = toU32(dataObj);
  }
  counter += 1;
  let counterObj = fromU32(counter);
  ledger.putData(key, counterObj);

  let vec = new Vec();
  vec.pushFront(key);
  vec.pushBack(counterObj);
  return vec.getHostObject();
}