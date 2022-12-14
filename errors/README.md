# Errors

The [errors example](https://github.com/Soneso/as-soroban-examples/tree/main/errors) demonstrates how to define and generate errors in a contract that invokers of the contract can understand and handle. The contract checks a given age. If the age is in the correct range, the contract returns "OK" otherwise the contract fails with an error code.


## Run the example

To run a contract in the sandbox, you must first install the official ```soroban-cli``` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```shell
cd errors
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Run the example contract:

```shell
soroban invoke --wasm build/release.wasm --id 6 --fn checkAge --arg 20
```

You should see the output:
```shell
OK
```

Next try with age 12:

```shell
soroban invoke --wasm build/release.wasm --id 6 --fn checkAge --arg 12
```

You should see the output:
```shell
error: HostError
Value: Status(ContractError(1))
```

## Code

You can find the code in:

```shell
add/assembly/index.ts
```

```typescript
import {fromSymbolStr, RawVal, toI32} from 'as-soroban-sdk/lib/value';
import * as context from "as-soroban-sdk/lib/context";

enum ALLOWED_AGE_RANGE {
  MIN = 18,
  MAX = 99
}

enum AGE_ERR_CODES {
  TOO_YOUNG = 1,
  TOO_OLD = 2
}

export function checkAge(age: RawVal): RawVal {

  let age2check = toI32(age);

  if (age2check < ALLOWED_AGE_RANGE.MIN) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_YOUNG);
  }

  if (age2check > ALLOWED_AGE_RANGE.MAX) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_OLD);
  }

  return fromSymbolStr("OK");
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/errors

## How it works

The enum ```ALLOWED_AGE_RANGE``` defines the allowed age range. The enum ```AGE_ERR_CODES``` defines the error codes. 

Errors can be returned from contract functions by ```context.failWithErrorCode(code)```. 

One can also use ```context.fail()```. It automatically inserts the error code ```0```.
