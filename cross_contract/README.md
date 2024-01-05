# Cross Contract Calls

The [cross contract call example](https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract) demonstrates how to call a contract from another contract.


## Run the example

To run a contract, you must first install the official `soroban-cli` as described here: [stellar soroban cli](https://soroban.stellar.org/docs/getting-started/setup).

```sh
cargo install --locked --version 20.1.1 soroban-cli
```

The example contains two contracts. To run them, first navigate in the directory of the first contract and build the contract (`contract_a`):

```shell
cd cross_contract
cd contract_a
npm install as-soroban-sdk
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Now deploy the `contract_a` in the soroban cli:

```sh
soroban contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

You should see an output similar to this:

```sh
CBLGDO6DQJLFQYNA4ZGCD2DAGSAALBNFUTFICENHJNXRP6PD62Q3ZRMI
```
representing the contract id of the `contract_a`.

Next navigate to the directory of the second contract (`contract_b`), install the sdk and build the contract.

```sh
cd ..
cd contract_b
npm install as-soroban-sdk
npm run asbuild:release
```

Now deploy the `contract_b` in the soroban cli:

```sh
soroban contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

You should see an output similar to this:
```sh
CCKC2IEKI7VPVGNQA6HK4IWKPWCO6HDSVBH73A2Y3SAGULWK72RHQMZM
```
representing the contract id of the `contract_b`.


Now invoke `contract_b` in the soroban cli:

```sh
soroban contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract_b id here> \
  -- callc \
  --addr <your contract_a id here>
```

You should see following output:
```sh
15
```

`contract_b` called `contract_a` and forwarded the result of the called function.


## Code

You can find the code of `contract_a` in:

```sh
cross_contract/contract_a/assembly/index.ts
```
It contains a simple function that applies the + operation to 2 integers received as arguments and returns the result.

The code of `contract_a` can be found in:

```sh
cross_contract/contract_b/assembly/index.ts
```


```typescript
import { AddressObject, I32Val, fromI32 } from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(addr: AddressObject): I32Val {

  let func = "add";
  let args = new Vec();
  args.pushBack(fromI32(3));
  args.pushBack(fromI32(12));
  
  return contract.callContract(addr, func, args);

}
```

## How it works

The `contract.callContract` method, provided by the [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk), allows the contract to call another contract's function.

It needs the address of the contract to be called, the name of the function to be executed and it's arguments packed in a vector.

The SDK also offers following other methods to call contract functions from within other contracts:

- `contract.tryCallContract(contract: AddressObject, func: SmallSymbolVal, args: Vec): Val` - If the call is successful, forwards the result of the called function. Otherwise, returns an `ErrorVal` containing the error type and code.

To get the error type and code from the `ErrorVal` one can use following code:

```typescript
import * as val from "as-soroban-sdk/lib/value";

//...
let result = contract.tryCallContract(addr, func, args);
if (val.isError(result)) {
  let errType = val.getErrorType(result);
  let errCode = val.getErrorCode(result);
  if (errType == val.errorTypeContract) {
    // ...
  }
}
```

Directly exposed host functions by the SDK via [env.ts](https://github.com/Soneso/as-soroban-sdk/blob/main/lib/env.ts) are:

- `env.call(contract: AddressObject, func: Symbol, args: VecObject): Val`
- `env.try_call(contract: AddressObject, func: Symbol, args: VecObject): Val`
