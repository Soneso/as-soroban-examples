# Hello Word

The [hello word example](https://github.com/Soneso/as-soroban-examples/tree/main/hello_word) demonstrates how to write a simple contract, with a single function that takes an input and returns a vector containing multiple host values.


## Run the example

To run a contract in the sandbox, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

Then, to run the example, navigate it's directory and install the assembly script soroban sdk. Then build the contract:

```sh
cd hello_word
npm install as-soroban-sdk
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Run the example contract:

```sh
soroban -q contract invoke --wasm build/release.wasm --id 1 -- hello --to friend
```

You should see the output:
```sh
["Hello","friend"]
```

## Code

You can find the code in:

```sh
hello_word/assembly/index.ts
```

```typescript
import {SmallSymbolVal, VecObject, fromSmallSymbolStr} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function hello(to: SmallSymbolVal): VecObject {

  let vec = new Vec();
  vec.pushFront(fromSmallSymbolStr("Hello"));
  vec.pushBack(to);
  
  return vec.getHostObject();
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/hello_word

## How it works

When calling a contract function the host will only pass so called host values. The SDK can encode and decode host values. A host value is a 64-bit integer carrying a bit-packed disjoint union of several cases, each identified by a different tag value (e.g. `i32`, `u32`, `symbol`, `timestamp`, `bool` etc. or ```object handles``` such as references to vectors, maps, bytes, strings that live in the host).

You can read more about host values and their types in [CAP-0046](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046-01.md#host-value-type).


The contract function `hello` defined in our contract has one argument of type `SmallSymbolVal`, and returns a `VecObject`. Both are host values. `SmallSymbolVal` being the host value passed by the host encoding the `symbol` (short string). And `VecObject` being the host value encoding a handle (reference) to the vector object that lives in the host.

The concrete types must also be defined in the [contract spec](https://github.com/Soneso/as-soroban-sdk#understanding-contract-metadata): `contract.json` file:

```json
{
    "functions": [
        {
            "name" : "hello",
            "arguments": [{"name": "to", "type": "symbol"}],
            "returns" : "vec[symbol]"
        }
    ],
    "meta": [
        {
            "key" : "name",
            "value" : "hello word"
        },
        {
            "key" : "version",
            "value" : "0.3.0"
        },
        {
            "key" : "description",
            "value" : "my first contract"
        }
    ]
}
```

The `hello` function from our contract first creates a new vector object on the host. Vectors can hold host values. To add the symbol `Hello` to the vector, it must first be encoded into a host value. This is done by using the `fromSmallSymbolStr` function of the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).

```typescript
let vec = new Vec();
vec.pushFront(fromSmallSymbolStr("Hello"));
```

Next, the host value obtained by argument is added to the vector. The contract function then returns a host value `VectorObject`, encoding the host object handle of the vector (reference to the vector object stored in the host).

```typescript
  vec.pushBack(to);
  return vec.getHostObject();
```