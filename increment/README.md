# Storing Data

The [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment) demonstrates how to write a simple contract that stores data, with a single function that increments an internal counter and returns the value.
This tutorial assumes that you've already completed the [hello word example](https://github.com/Soneso/as-soroban-examples/tree/main/hello_word).

## Run the example

To run a contract, you must first install the official [stellar-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked stellar-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd increment
npm install
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Deploy the example contract:

```sh
stellar contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

This returns the ID of the contract, starting with a C. Similar to this:

```sh
CAOINA7M7367SZY3PS3ENINYI4RMUYM2E47CNLUOEVSWOVTU6U2YA5NG
```

Next let's invoke:

```sh
stellar -q contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- increment
```

You should see the output:
```sh
1
```

If you run the contract again, you should see the output:
```sh
2
```

## Code

You can find the code in:

```sh
increment/assembly/index.ts
```

```typescript
import { toU32, fromU32, U32Val, storageTypePersistent} from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = "COUNTER";
  let counter = 0;

  // Get the current count.
  if (ledger.hasDataFor(key, storageTypePersistent)) {
    let dataObj = ledger.getDataFor(key, storageTypePersistent);
    counter = toU32(dataObj);
  }

  // Increment the count.
  counter += 1;

  // Save the count.
  ledger.putDataFor(key, fromU32(counter), storageTypePersistent);

  // Return the count to the caller.
  return ledger.getDataFor(key, storageTypePersistent);
  
}
```

## How it works

Host and contract communicate via host values. 

The contract function `increment` defined in our contract has no arguments but returns a `U32Val` (host value).

The concrete types must also be defined in the [contract spec](https://github.com/Soneso/as-soroban-sdk#understanding-contract-metadata): `contract.json` file:

```json
{
    "functions": [
        {
            "name" : "increment",
            "arguments": [],
            "returns" : "u32"
        }
    ],
    "meta": [
        {
            "key" : "name",
            "value" : "increment"
        },
        {
            "key" : "version",
            "value" : "1.1.0"
        },
        {
            "key" : "description",
            "value" : "increment smart contract example using storage"
        }
    ]
}
```

The `increment` function from our contract, first defines the key for the counter to be stored. The key can be used at a later time to look up the value. Then it checks if the contract already has the counter stored. If so, it loads the data (host value), decodes it to `u32` (primitive) and assigns its value to the `counter` variable. To decode the host value obtained from the host it is using the `toU32` function of the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).

```typescript
let key = "COUNTER";
let counter = 0;
if (ledger.hasDataFor(key, storageTypePersistent)) {
  let dataObj = ledger.getDataFor(key, storageTypePersistent);
  counter = toU32(dataObj);
}
```

Next, the counter is incremented and stored back into the ledger. To store the counter, it must be first encoded back into a host value using the `fromU32` function provided by the sdk.

```typescript
counter += 1;
ledger.putDataFor(key, fromU32(counter), storageTypePersistent);
```

Finally the function loads the counter from storage again (host value) and returns it.

```typescript
return ledger.getDataFor(key, storageTypePersistent);
```
To store and load data from storage, the contract uses the wrapped helper functions provided by the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).

## Storage types

It's worth knowing that there are three kinds of storage: `Persistent`, `Temporary`, and `Instance`. Please read more about persisting data and the storage types [here](https://soroban.stellar.org/docs/fundamentals-and-concepts/persisting-data).

In the above example we used `Persistent` storage. Next, let's use `Instance` storage to see how to manage contract data lifetimes with `bump`.

All contract data has a `lifetime` that must be periodically bumped. If an entry's lifetime is not periodically bumped, the entry will eventually reach the end of its lifetime and `expire`. You can learn more about this in the [State Expiration](https://soroban.stellar.org/docs/fundamentals-and-concepts/state-expiration) document.

## Managing Contract Data Lifetimes

The contract in the file `index2.ts` uses `Instance` storage: ```ledger.putDataFor(key, fromU32(counter), storageTypeInstance);```. Every time the counter is incremented, this storage gets bumped by 100 ledgers, or about 500 seconds: ```ledger.extendCurrentContractInstanceAndCodeTtl(50, 100);```.

Let's have a look to the contract code:

```typescript
import { toU32, fromU32, U32Val, storageTypeInstance} from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = "COUNTER";
  let counter = 0;

  // Get the current count.
  if (ledger.hasDataFor(key, storageTypeInstance)) {
    let dataHostValue = ledger.getDataFor(key, storageTypeInstance);
    counter = toU32(dataHostValue);
  }

  // Increment the count.
  counter += 1;

  // Save the count.
  ledger.putDataFor(key, fromU32(counter), storageTypeInstance);

  // The contract instance will be bumped to have a lifetime of at least 100 ledgers if the current expiration lifetime at most 50.
  // If the lifetime is already more than 100 ledgers, this is a no-op. Otherwise,
  // the lifetime is extended to 100 ledgers. This lifetime bump includes the contract
  // instance itself and all entries of storageTypeInstance, i.e, COUNTER.
  ledger.extendCurrentContractInstanceAndCodeTtl(50, 100);

  // Return the count to the caller.
  return ledger.getDataFor(key, storageTypeInstance);

}
```

Next, lets deploy and run the contract on testnet:

Build the contract:

```sh
npm run asbuild2:release
```
```sh
stellar contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

This returns the ID of the contract, starting with a C. Similar to this:

```sh
CCYC3FE7RX4OPUAOZO5C7CYSWH7T6NXR6KC3GD7NNPGHOCGXQMTI4PHS
```

Next let's invoke:

```sh
stellar -q contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- increment
```

The following output should appear:
```sh
1
```

Now repeat invoking the increment function to increment the counter.


## Optimizing the contract code

You can optimize this contract code by encoding the key to a host value only once and then using other, corresponding functions offered by the SDK to store the data.

Let's have a look to the contract in `index3.ts`:

```typescript
import { toU32, fromU32, U32Val, storageTypePersistent, fromSmallSymbolStr} from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = fromSmallSymbolStr("COUNTER");
  let counter = 0;

  // Get the current count.
  if (ledger.hasData(key, storageTypePersistent)) {
    let dataObj = ledger.getData(key, storageTypePersistent);
    counter = toU32(dataObj);
  }

  // Increment the count.
  counter += 1;

  // Save the count.
  ledger.putData(key, fromU32(counter), storageTypePersistent);

  // Return the count to the caller.
  return ledger.getData(key, storageTypePersistent);
  
}
```

As you can see, we are defining the `key` as a host value and use it directly to call the functions.
By doing so, the string value must not be encoded every time a storage function from the SDK is called. For example, let's have a look to the implementation of the wrapped function ```ledger.getDataFor(smallSymbolKey: string, storageType: StorageType): Val```:

```typescript
 export function getDataFor(smallSymbolKey: string, storageType: StorageType): Val {
    let keySymbolVal = fromSmallSymbolStr(smallSymbolKey);
    return get_contract_data(keySymbolVal, storageType);
}

```

As you can see the input type for key here is a `string` and it needs to be encoded to a host value first before calling the corresponding host function:

```typescript
let keySymbolVal = fromSmallSymbolStr(smallSymbolKey);
return get_contract_data(keySymbolVal, storageType);
```

This will be repeated in every wrapped function such as `hasDataFor` or `putDataFor`. So, if you want to optimize your contract you can encode it once:

```typescript
let key = fromSmallSymbolStr("COUNTER");
```

and use it several times by calling the corresponding SDK functions. Here:

```typescript
export function hasData(key: Val, storageType:StorageType): bool
export function getData(key: Val, storageType: StorageType) : Val
export function putData(key: Val, value: Val, storageType: StorageType) : void 
```


Now let's have a look to the size difference of the compiled contract.

First build the contract from `index.ts` that uses the wrapped functions of the SDK and check its size:

```sh
npm run asbuild:release
ls -la build/
```

The size of the compiled .wasm file is 781 bytes:
```
-rw-r--r--   1 chris  staff   785 Dec 13 22:29 release.wasm
-rw-r--r--   1 chris  staff  4930 Dec 13 22:29 release.wat
```

Next let's build the contract from `index3.ts` that uses the direct host functions of the SDK and check its size:

```sh
npm run asbuild3:release
ls -la build/
```

The size of the compiled .wasm file is 773 bytes:

```
-rw-r--r--   1 chris  staff   773 Dec 13 22:29 release.wasm
-rw-r--r--   1 chris  staff  4627 Dec 13 22:29 release.wat
```

Of course, this is only a small improvement, but it shows how one can optimize contracts by using the correct functions of the SDK, depending on the use case.

The SDK also exposes the host functions directly via [env.js](https://github.com/Soneso/as-soroban-sdk/blob/main/lib/env.ts). In some cases it may be good to use them, if for example the SDK does not offer optimized `wrapped` functions for the corresponding functionality.

For storing data for example, the SDK exposes following host functions directly:

```typescript
export declare function has_contract_data(k:Val, t:StorageType): BoolVal;
export declare function put_contract_data(k:Val, v:Val, t:StorageType): VoidVal;
export declare function get_contract_data(k:Val, t:StorageType): Val;
export declare function del_contract_data(k:Val, t:StorageType): VoidVal;
```

In `index4.ts` the directly exposed host functions are used to achieve the same functionality:

```typescript
import { toU32, fromU32, U32Val, storageTypePersistent, fromSmallSymbolStr, toBool} from "as-soroban-sdk/lib/value";
import * as env from "as-soroban-sdk/lib/env";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = fromSmallSymbolStr("COUNTER");
  let counter = 0;

  // Get the current count.
  if (toBool(env.has_contract_data(key, storageTypePersistent))) {
    let dataObj = env.get_contract_data(key, storageTypePersistent)
    counter = toU32(dataObj);
  }

  // Increment the count.
  counter += 1;

  // Save the count.
  env.put_contract_data(key, fromU32(counter), storageTypePersistent)

  // Return the count to the caller.
  return env.get_contract_data(key, storageTypePersistent)
  
}
```
