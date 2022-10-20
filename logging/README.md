# Logging

The [logging exammple](https://github.com/Soneso/as-soroban-examples/tree/main/logging) demonstrates how to log for the purpose of debugging.


## Run the example

To run a contract in the sandbox, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

Then, to run the example, navigate it's directory install the sdk. Then build the contract:

```shell
cd logging
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Now you can run the example contract:

```shell
soroban invoke --wasm build/release.wasm --id 10 --fn logging
```

You should see the output:
```shell
null
#0: debug: Hello, today is a sunny day!
#1: debug: We have I32(30) degrees Symbol(celsius)!
```

## Code

You can find the code in:

```shell
logging/assembly/index.ts
```

```typescript
import * as context from 'as-soroban-sdk/lib/context';
import {RawVal, fromI32, fromSymbolStr, fromVoid} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function logging(): RawVal {

  context.log_str("Hello, today is a sunny day!");

  let args = new Vec();
  args.push_back(fromI32(30));
  args.push_back(fromSymbolStr("celsius"));
  context.log_ftm("We have {} degrees {}!", args);

  return fromVoid();
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/logging

## How it works

The ```context.log_str``` method, provided by [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk), logs a string. Any logs that occur during execution are outputted to stdout in soroban-cli.

The ```context.log_ftm``` method lets the host build a string from the format string, and a list of arguments. Arguments are substituted wherever the {} value appears in the format string.

The arguments must be passed in a Vector containing raw values. Please read more details about raw values in [CAP-46](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046.md#host-value-type).

To convert primitives or short strings into raw values you can use the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk).
