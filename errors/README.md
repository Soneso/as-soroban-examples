# Errors

The [errors example](https://github.com/Soneso/as-soroban-examples/tree/main/errors) demonstrates how to define and generate errors in a contract that invokers of the contract can understand and handle. The contract checks a given age. If the age is in the correct range, the contract returns "OK" otherwise the contract fails with an error code.


## Run the example

To run a contract you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked --version 20.0.2 soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd errors
npm install as-soroban-sdk
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Deploy the example contract:

```sh
soroban contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```
This returns the ID of the contract, starting with a C. Next let's invoke:

```sh
soroban -q contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- checkAge --age 20 
```

You should see the output:
```sh
OK
```

Next try with age 12:

```sh
soroban -q contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- checkAge --age 12
```

You should see the output:
```sh
error: HostError: Error(Contract, #1)
```

## Code

You can find the code in:

```shell
add/assembly/index.ts
```

```typescript
import {fromSmallSymbolStr, Val, U32Val, toU32} from 'as-soroban-sdk/lib/value';
import * as context from "as-soroban-sdk/lib/context";

enum AGE_ERR_CODES {
  TOO_YOUNG = 1,
  TOO_OLD = 2
}

export function checkAge(age: U32Val): Val {

  let age2check = toU32(age);

  context.logMgsAndValue("Age", age);

  if (age2check < 18) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_YOUNG);
  }

  if (age2check > 99) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_OLD);
  }

  return fromSmallSymbolStr("OK");
}
```

## How it works

The enum `AGE_ERR_CODES` defines the error codes. 

Contracts can fail with u32 error codes by using: `context.failWithErrorCode(code)`. 

One can also use `context.fail()`. It automatically uses the error code `0`.

The directly exposed host function via [env.js](https://github.com/Soneso/as-soroban-sdk/blob/main/lib/env.ts) is:

```typescript
export declare function fail_with_error(error: ErrorVal): VoidVal;
```

