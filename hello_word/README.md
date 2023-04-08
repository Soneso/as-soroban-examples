# Hello Word

The [hello word example](https://github.com/Soneso/as-soroban-examples/tree/main/hello_word) demonstrates how to write a simple contract, with a single function that takes one input and returns it as an output.


## Run the example

To run a contract in the sandbox, you must first install the official `soroban-cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 0.7.0 soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd hello_word
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Run the example contract:

```sh
soroban contract invoke --wasm build/release.wasm --id 8 -- hello --to friend
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

When calling a contract function the host will only pass `u64` raw values. The raw values can encode different types of small values (e.g. `i32`, `u32`, `symbol`, etc.) or `object handles`. Please read more details about them in [CAP-46](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046.md#host-value-type).

The contract function `hello` defined in our contract has one argument of type `SmallSymbolVal`, and returns a `VecObject`. Both are `u64` raw values. `SmallSymbolVal` being the `u64` passed by the host encoding the `symbol` (short string). And `VecObject` being the `u64` passed to the host as a result encoding a handle to the vector object stored in the host.

The concrete types must also be defined in the [contract spec](https://github.com/Soneso/as-soroban-sdk#understanding-contract-metadata): `contract.json` file:

```json
{
    "name": "hello word",
    "version": "0.1.8",
    "description": "my first contract",
    "host_functions_version": 32,
    "functions": [
        {
            "name" : "hello",
            "arguments": [{"name": "to", "type": "symbol"}],
            "returns" : "vec[symbol]"
        }
    ]
}
```

The `hello` function from our contract first creates a new Vector object on the host. Vectors can hold raw values. To add the symbol `Hello` to the vector, it must first be encoded into a raw value. This is done by using the `fromSmallSymbolStr` function of the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).

```typescript
let vec = new Vec();
vec.pushFront(fromSmallSymbolStr("Hello"));
```

Next the raw value obtained by argument is added to the vector. The contract function then returns a raw value `VectorObject`, encoding the host object handle of the vector.

```typescript
  vec.pushBack(to);
  return vec.getHostObject();
```