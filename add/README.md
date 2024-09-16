# Add

The [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add) demonstrates how to write a simple contract, with a single function that takes two `i32` inputs and returns their sum as an output.


## Run the example

To run a contract, you must first install the official [stellar-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked stellar-cli
```

Then, to run the example, navigate it's directory and install the SDK. Then build the contract:

```sh
cd add
npm install
npm run asbuild:release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Run the example contract:

To run the contract, we first need to deploy it:

```sh
stellar contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```
This returns the ID of the contract, starting with a C. Next let's invoke:

```sh
stellar -q contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- add --a 1 --b 5 
```

You should see the output:
```sh
6
```

## Code

You can find the code in:

```sh
add/assembly/index.ts
```

```typescript
import { I32Val, toI32, fromI32 } from 'as-soroban-sdk/lib/value';

export function add(a: I32Val, b: I32Val): I32Val {

  // decode arguments from host values to i32 primitives
  let ai:i32 = toI32(a);
  let bi:i32 = toI32(b);

  // add
  let sum = ai + bi;
  
  // encode to host value
  let result = fromI32(sum);

  // return host value
  return result;
}
```

## How it works

When calling a contract function the host will only pass so called host values. The SDK can encode and decode host values. A host value is a 64-bit integer carrying a bit-packed disjoint union of several cases, each identified by a different tag value (e.g. `i32`, `u32`, `symbol`, `timestamp`, `bool` etc. or ```object handles``` such as references to vectors, maps, bytes, strings that live in the host).

You can read more about host values and their types in [CAP-0046](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046-01.md#host-value-type).

The contract function `add` defined in our contract has 2 arguments of type `I32Val`, and returns a `I32Val`. `I32Val` representing the host values passed by and to the host.

The concrete types must also be defined in the [contract spec](https://github.com/Soneso/as-soroban-sdk#understanding-contract-metadata): `contract.json` file:

```json
{
    "functions": [
        {
            "name" : "add",
            "arguments": [
                {"name": "a", "type": "i32"},
                {"name": "b", "type": "i32"}
            ],
            "returns" : "i32"
        }
    ],
    "meta": [
        {
            "key" : "name",
            "value" : "add"
        },
        {
            "key" : "version",
            "value" : "1.1.0"
        },
        {
            "key" : "description",
            "value" : "soroban contract example adding 2 integers"
        }
    ]
}
```

Because the host calls our function with `I32Val` (host value), we need to decode them first into `i32` primitives. To do so, we use the SDKs function `toI32` which decodes the `I32Val` (host value) into a `i32` (primitive).

```typescript
let ai:i32 = toI32(a);
let bi:i32 = toI32(b);
```

Next, we can apply the + operation to our integers and return the result to the host. Because the host expects `I32Val` (host value) as a return value, we must encode the result into a such a host value containing our `i32` sum.

```typescript
// add
let sum = ai + bi;

// encode to host value
let result = fromI32(sum);

// return host value
return result;
```
