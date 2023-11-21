# Auth

The [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth) demonstrates how to implement authentication and authorization using the [Soroban Host-managed auth framework](https://soroban.stellar.org/docs/fundamentals-and-concepts/authorization). This example is an extension of the [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract in the sandbox, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd auth
npm install as-soroban-sdk
npm run asbuild:release
```

Since we are dealing with authorization and signatures, we need to set up some identities to use for testing and get their public keys:

```sh
soroban config identity generate acc1 && \
soroban config identity generate acc2 && \
soroban config identity address acc1 && \
soroban config identity address acc2
```

Example output with the public key of the identity:
```sh
GDNNLVOEOAQADO5UKZ5PI3WETSAHKGZWLOTKFNOADXAKK76DWHXK47KO
GD5R3D5WMZWWMIEMJXFAQWN4OS5MTMBKCU4XI2OLS56J7OWPBGJP3DLR
```

Now the contract itself can be invoked. Notice the --source has to match --user argument in order to allow soroban tool to automatically sign the necessary payload for the invocation.

```sh
soroban -q contract invoke \
    --source acc1 \
    --id 1 \
    --wasm build/release.wasm \
    -- auth \
    --user GDNNLVOEOAQADO5UKZ5PI3WETSAHKGZWLOTKFNOADXAKK76DWHXK47KO \
    --value 3
```

Run a few more increments for both accounts.

```sh
soroban -q contract invoke \
    --source acc2 \
    --id 1 \
    --wasm build/release.wasm \
    -- auth \
    --user GBI5PLC6I7VUW47RIHIRHX3FHWXSBRBNO4ZO5UJRJEPDGHIPZHVUH7GC \
    --value 2
```

```sh
soroban -q contract invoke \
    --source acc1 \
    --id 1 \
    --wasm build/release.wasm \
    -- auth 
    --user GDNNLVOEOAQADO5UKZ5PI3WETSAHKGZWLOTKFNOADXAKK76DWHXK47KO \
    --value 14
```

```sh
soroban -q contract invoke \
    --source acc2 \
    --id 1 \
    --wasm build/release.wasm \
    -- auth \
    --user GBI5PLC6I7VUW47RIHIRHX3FHWXSBRBNO4ZO5UJRJEPDGHIPZHVUH7GC \
    --value 5
```

## Code

You can find the code of the contract in:

```sh
auth/assembly/index.ts
```
It contains the function `auth()`, which stores a per-Address counter that can only be incremented by the owner of that Address:

```typescript
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
```

## How it works

`AddressObject` is a universal Soroban identifier that may represent a Stellar account, a contract or an 'account contract' (a contract that defines a custom authentication scheme and authorization policies). Contracts don't need to distinguish between these internal representations though. `AddressObject` can be used any time some network identity needs to be represented, like to distinguish between counters for different users in this example.

The `auth` function first checks the invoker type using the `address.requireAuth(user)` which can be called for any Address. Semantically `address.requireAuth(user)` here means 'require user to have authorized calling increment function of the current contract instance with the current call arguments, i.e. the current user and value argument values'. In simpler terms, this ensures that the user has allowed incrementing their counter value and nobody else can increment it.

When using `address.requireAuth` the contract implementation doesn't need to worry about the signatures, authentication, and replay prevention. All these features are implemented by the Soroban host and happen automatically as long as Address type is used.

Address has another, more extensible version of this method called `address.requireAuthForArgs`. It works in the same fashion as `address.requireAuth`, but allows customizing the arguments that need to be authorized. Note though, this should be used with care to ensure that there is a deterministic mapping between the contract invocation arguments and the `address.requireAuthForArgs` arguments.

## Further reading

[Authorization documentation](https://soroban.stellar.org/docs/fundamentals-and-concepts/authorization) provides more details on how Soroban auth framework works.
[Atomic Swap example](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap) demonstrates advanced usage of Soroban auth framework.