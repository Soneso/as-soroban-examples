# Storing Data

The [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment) demonstrates how to write a simple contract that stores data, with a single function that increments an internal counter and returns the value.


## Run the example

To run a contract in the sandbox, you must first install the official `soroban-cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 0.9.4 soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd increment
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Run the example contract:

```sh
soroban contract invoke --wasm build/release.wasm --id 9 -- increment
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
import { toU32, fromU32, U32Val, 
storageTypePersistent, fromVoid } from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

export function increment(): U32Val {

  let key = "COUNTER";
  var counter = 0;
  if (ledger.hasDataFor(key, storageTypePersistent)) {
    let dataObj = ledger.getDataFor(key, storageTypePersistent);
    counter = toU32(dataObj);
  }
  counter += 1;
  ledger.putDataFor(key, fromU32(counter), storageTypePersistent, fromVoid());
  return ledger.getDataFor(key, storageTypePersistent);
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/increment

## How it works

Host and contract communicate via `u64` raw values. 

The contract function `increment` defined in our contract has no arguments but returns a `U32Val`. It is a `u64` raw value encoding the u32 to be passed to the host as a result. Please read more details about raw values in [CAP-46](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046.md#host-value-type).

The concrete types must also be defined in the [contract spec](https://github.com/Soneso/as-soroban-sdk#understanding-contract-metadata): `contract.json` file:

```json
{
    "host_functions_version": 51,
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
            "value" : "0.2.1"
        },
        {
            "key" : "description",
            "value" : "increment smart contract example using storage"
        }
    ]
}
```

The `increment` function from our contract first defines the key for the counter to be stored. Then it checks if the contract already has the counter stored. If so,
it loads it, decodes it to `u32` and assigns its value to the `counter` variable. To decode the raw value obtained from the host it is using the `toU32` function of the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).

```typescript
let key = "COUNTER";
var counter = 0;
if (ledger.hasDataFor(key, storageTypePersistent)) {
  let dataObj = ledger.getDataFor(key, storageTypePersistent);
  counter = toU32(dataObj);
}
```

Next, the counter is incremented and stored back into the ledger. To store the counter it must be first encoded back into a raw value using the `fromU32` function provided by the sdk.

```typescript
counter += 1;
ledger.putDataFor(key, fromU32(counter), storageTypePersistent, fromVoid());
```

Finally the function loads the counter from storage again and returns it.

```typescript
return ledger.getDataFor(key, storageTypePersistent);
```
To store and load data from storage, the contract uses the helper functions provided by the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).