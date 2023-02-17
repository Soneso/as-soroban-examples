import {AddressObject, MapObject, RawVal, fromU32, toU32} from 'as-soroban-sdk/lib/value';
import {Map} from 'as-soroban-sdk/lib/map';
import * as ledger from 'as-soroban-sdk/lib/ledger';
import * as address from 'as-soroban-sdk/lib/address';

export function auth(user: AddressObject, value: RawVal): MapObject {

  address.requireAuth(user);

  // let argsVec = new Vec();
  // argsVec.pushFront(value);
  // address.requireAuthForArgs(user, argsVec);

  var counter = 0;
  
  if (ledger.hasData(user)) {
    let dataValue = ledger.getData(user);
    counter = toU32(dataValue);
  }

  counter += toU32(value);
  let counterVal = fromU32(counter);
  ledger.putData(user, counterVal);

  let map = new Map();
  map.put(user, counterVal);

  return map.getHostObject();
}