# Auth

The [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth) demonstrates how to implement authentication and authorization using the [Soroban Host-managed auth framework](https://soroban.stellar.org/docs/fundamentals-and-concepts/authorization). This example is an extension of the [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract in the sandbox, you must first install the official `soroban-cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd auth
npm install as-soroban-sdk
asc assembly/index.ts --target release
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
import {AddressObject, MapObject, RawVal, fromU32, 
fromVoid, storageTypePersistent, toU32} from 'as-soroban-sdk/lib/value';
import {Map} from 'as-soroban-sdk/lib/map';
import * as ledger from 'as-soroban-sdk/lib/ledger';
import * as address from 'as-soroban-sdk/lib/address';

export function auth(user: AddressObject, value: RawVal): MapObject {

  address.requireAuth(user);

  // let argsVec = new Vec();
  // argsVec.pushFront(value);
  // address.requireAuthForArgs(user, argsVec);

  var counter = 0;
  
  if (ledger.hasData(user, storageTypePersistent)) {
    let dataValue = ledger.getData(user, storageTypePersistent);
    counter = toU32(dataValue);
  }

  counter += toU32(value);
  let counterVal = fromU32(counter);
  ledger.putData(user, counterVal, storageTypePersistent, fromVoid());

  let map = new Map();
  map.put(user, counterVal);

  return map.getHostObject();
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/auth

## How it works

The `auth` function first checks the invoker type using the `address.requireAuth(user)` which can be called for any Address. Semantically `address.requireAuth(user)` here means 'require user to have authorized calling increment function of the current contract instance with the current call arguments, i.e. the current user and value argument values'. In simpler terms, this ensures that the user has allowed incrementing their counter value and nobody else can increment it.

When using `requireAuth` the contract implementation doesn't need to worry about the signatures, authentication, and replay prevention. All these features are implemented by the Soroban host and happen automatically as long as Address type is used.

Address has another, more extensible version of this method called `requireAuthForArgs`. It works in the same fashion as `requireAuth`, but allows customizing the arguments that need to be authorized. Note though, this should be used with care to ensure that there is a deterministic mapping between the contract invocation arguments and the `requireAuthForArgs` arguments.

## Further reading

[Authorization documentation](https://soroban.stellar.org/docs/fundamentals-and-concepts/authorization) provides more details on how Soroban auth framework works.
[Atomic Swap example](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap) demonstrates advanced usage of Soroban auth framework.