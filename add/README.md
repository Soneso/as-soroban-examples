# Add

The [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add) demonstrates how to write a simple contract, with a single function that takes two i32 inputs and returns their sum as an outout.


## Run the example

To run a contract in the sandbox, you must first install the official ```soroban cli``` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```shell
cd add
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Run the example contract:

```shell
soroban invoke --wasm build/release.wasm --id 6 --fn add --arg 1 --arg 5
```

You should see the output:
```shell
6
```

## Code

You can find the code in:

```shell
add/assembly/index.ts
```

```typescript
import {RawVal, toI32, fromI32 } from 'as-soroban-sdk/lib/value';

export function add(a: RawVal, b: RawVal): RawVal {

  let ai32 = toI32(a);
  let bi32 = toI32(b);

  return (fromI32(ai32 + bi32));
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/add

## How it works

When calling a contract function the host will only pass ```u64``` raw values. The raw values can encode different types of values (e.g. ```i32```, ```u32```, ```symbol```, ```bitset```, etc.) or ```object handles```. Please read more details about them in [CAP-46](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046.md#host-value-type).

The contract function ```add``` defined in our contract has 2 arguments of type ```RawVal```, and also returns a ```RawVal```. ```RawVal``` being the u64 passed by and to the host: (```type RawVal = u64```).

The concrete types encoded in the ```RawVal```'s for our arguments are defined in the [contract spec](https://github.com/Soneso/as-soroban-sdk#understanding-contract-metadata): ```contract.json``` file:

```json
{
    "name": "add",
    "version": "0.0.1",
    "description": "soroban contract example adding 2 integers",
    "host_functions_version": 27,
    "functions": [
        {
            "name" : "add",
            "arguments": [
                {"name": "a", "type": "i32"},
                {"name": "b", "type": "i32"}
            ],
            "returns" : "i32"
        }
    ]
}
```

Because the host calles the function with ```RawVal```, we need to decode them first into ```i32``` primitives. To do so, we use the
SDKs function ```toI32``` wich decodes the ```RawVal``` into a ```i32```.

```typescript
let ai32 = toI32(a);
let bi32 = toI32(b);
```

Next we can apply the + operation to our integers and return the result to the host. Because the hosts expects ```RawVal``` as a return value, we must encode the result into a ```RawVal``` containing our ```i32``` sum.

```typescript
return (fromI32(ai32 + bi32));
```
