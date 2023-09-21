# Cross Contract Calls

The [cross contract call example](https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract) demonstrates how to call a contract from another contract.


## Run the example

To run a contract in the sandbox, you must first install the official `soroban-cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

The example contains two contracts. To run them first navigate in the directory of the first contract and build the contract (`contract_a`):

```shell
cd cross_contract
cd contract_a
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Now navigate back to the example directory and deploy the `contract_a` in the soroban cli:

Hint: it is important to use the soroban cli in the main directory of the example because when executed, it adds a `.soroban` folder to store its data (e.g. deployed contracts).

```sh
cd ..
soroban contract deploy --wasm contract_a/build/release.wasm
```

You should see an output similar to this:

```sh
CCNRC22AWLSATO5INBCVGSH3MW4RECEU33LSXHSCIQWAM6Y4W4UU3OPO
```
representing the address of the contract that has been deployed as a strkey.

First we need to convert the strkey to a hex contract id:

```
https://rpciege.com/convert/%3Chex-or-strkey%3E
```

The result contract id is:

```sh
9b116b40b2e409bba868455348fb65b9120894ded72b9e42442c067b1cb7294d
```

Next navigate to the dicrectory of the second contract (`contract_b`) and install the sdk.

```sh
cd contract_b
npm install as-soroban-sdk
```

Before we build the contract_b, we need to replace the contract id to be called in the source code of `contract_b`. 
Open the contract_b/assembly/index.ts file and replace the contract id in the code. Paste the contract id of `contract_a` that you received as you deployed it.

```typescript
let contractId = "9b116b40b2e409bba868455348fb65b9120894ded72b9e42442c067b1cb7294d";
```

Next, build `contract_b`:

```sh
asc assembly/index.ts --target release
```

Now navigate back to the example directory and invoke `contract_b` in the soroban cli:

```sh
cd ..
soroban -q contract invoke --wasm contract_b/build/release.wasm --id 19 -- callc
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
import { I32Val, fromI32 } from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): I32Val {

  let contractId = "9b116b40b2e409bba868455348fb65b9120894ded72b9e42442c067b1cb7294d";
  let func = "add";
  let args = new Vec();
  args.pushBack(fromI32(3));
  args.pushBack(fromI32(12));
  return contract.callContractById(contractId, func, args.getHostObject());

}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract/contract_b

## How it works

The `contract.callContractById` method, provided by [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk), allows the contract to call another contracts function.

It needs the id of the contract to be called, the name of the function to be executed and it's arguments packed in a vector.
