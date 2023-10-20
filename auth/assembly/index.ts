import {AddressObject, MapObject, U32Val, fromU32, storageTypePersistent, toU32} from 'as-soroban-sdk/lib/value';
import {Map} from 'as-soroban-sdk/lib/map';
import * as ledger from 'as-soroban-sdk/lib/ledger';
import * as address from 'as-soroban-sdk/lib/address';

export function auth(user: AddressObject, value: U32Val): MapObject {

  address.requireAuth(user);

  let counter:u32 = 0;
  
  if (ledger.hasData(user, storageTypePersistent)) {
    let dataValue = ledger.getData(user, storageTypePersistent);
    // decode to u32 primitive
    counter = toU32(dataValue);
  }

  // add value given by parameter to counter
  counter += toU32(value);
  
  // encode counter to host value
  let counterHostVal = fromU32(counter);

  // store
  ledger.putData(user, counterHostVal, storageTypePersistent);

  let map = new Map();
  map.put(user, counterHostVal);

  return map.getHostObject();
}