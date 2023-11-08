//! This contract demonstrates how to implement authorization using
//! Soroban-managed auth framework for a simple case (a single user that needs
//! to authorize a single contract invocation).
//!
//! See `timelock` and `single_offer` examples for demonstration of performing
//! authorized token operations on behalf of the user.
//!
//! See `atomic_swap` and `multi_swap` examples for demonstration of
//! multi-party authorizaton.
//!
//! See `custom_account` example for demonstration of an acount contract with
//! a custom authentication scheme and a custom authorization policy.

import {AddressObject, MapObject, U32Val, fromU32, storageTypePersistent, toU32} from 'as-soroban-sdk/lib/value';
import {Map} from 'as-soroban-sdk/lib/map';
import * as ledger from 'as-soroban-sdk/lib/ledger';
import * as address from 'as-soroban-sdk/lib/address';

/// Adds a value to the a counter for the user, and returns a map containing the user and current counter value.
export function auth(user: AddressObject, value: U32Val): MapObject {

  // Requires `user` to have authorized call of the `increment` of this
  // contract with all the arguments passed to `increment`, i.e. `user`
  // and `value`. This will panic if auth fails for any reason.
  // When this is called, Soroban host performs the necessary
  // authentication, manages replay prevention and enforces the user's
  // authorization policies.
  // The contracts normally shouldn't worry about these details and just
  // write code in generic fashion using `AddressObject` and `address.requireAuth` (or
  // `address.requireAuthForArgs`).
  address.requireAuth(user);

  // This call is equilvalent to the above:
  // let args = new Vec();
  // args.pushBack(user);
  // agrs.pushBack(value);
  // address.requireAuthForArgs(user, args);

  // The following has less arguments but is equivalent in authorization
  // scope to the above calls (the user address doesn't have to be
  // included in args as it's guaranteed to be authenticated).
  // let args = new Vec();
  // agrs.pushBack(value);
  // address.requireAuthForArgs(user, args);

  let counter:u32 = 0;
  
  // Get the current count for the invoker.
  if (ledger.hasData(user, storageTypePersistent)) {
    let dataValue = ledger.getData(user, storageTypePersistent);
    // decode to u32 primitive
    counter = toU32(dataValue);
  }

  // Add value given by parameter to counter.
  counter += toU32(value);
  
  // Encode counter to host value.
  let counterHostVal = fromU32(counter);

  // Save the count.
  ledger.putData(user, counterHostVal, storageTypePersistent);

  // Return the user and current counter value to the caller.
  let map = new Map();
  map.put(user, counterHostVal);

  return map.getHostObject();
}