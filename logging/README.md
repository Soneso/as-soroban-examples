# Logging

The [logging example](https://github.com/Soneso/as-soroban-examples/tree/main/logging) demonstrates how to log for the purpose of debugging.


## Run the example

To run a contract in the sandbox, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

Then, to run the example, navigate it's directory install the sdk. Then build the contract:

```sh
cd logging
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Now you can run the example contract:

```sh
soroban contract invoke --wasm build/release.wasm --id 10 -- logging
```

You should see the output:
```sh
//...

2023-09-21T10:21:59.294137Z  INFO soroban_cli::log::host_event: 1: HostEvent {
    event: ContractEvent {
        ext: V0,
        contract_id: Some(
            Hash(0000000000000000000000000000000000000000000000000000000000000010),
        ),
        type_: Diagnostic,
        body: V0(
            ContractEventV0 {
                topics: VecM(
                    [
                        Symbol(
                            ScSymbol(
                                StringM(log),
                            ),
                        ),
                    ],
                ),
                data: String(
                    ScString(
                        StringM(Hello, today is a sunny day!),
                    ),
                ),
            },
        ),
    },
    failed_call: false,
}

//...
```

## Code

You can find the code in:

```sh
logging/assembly/index.ts
```

```typescript
import * as context from 'as-soroban-sdk/lib/context';
import {VoidVal ,fromI32, fromSmallSymbolStr, fromVoid} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function logging(): VoidVal {

  context.logStr("Hello, today is a sunny day!");

  let values = new Vec();
  values.pushBack(fromI32(30));
  values.pushBack(fromSmallSymbolStr("celsius"));
  context.log("Temperature today:", values);

  return fromVoid();
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/logging

## How it works

The `context.logStr` method, provided by [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk), logs a string. Any logs that occur during execution are outputted to stdout in soroban-cli.

The `context.log` method lets you log a string and a list of values.

The arguments must be passed in a Vector containing raw values. Please read more details about raw values in [CAP-46](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046.md#host-value-type).

To convert primitives or short strings into raw values you can use the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).