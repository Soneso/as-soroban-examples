# Cross contract Calls

The [cross contract call exammple](https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract) demonstrates how to call a contract from another contract.


## Run the example

To run a contract in the sandbox, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

The example contains two contracts. To run them first navigate in the directory of the first contract and build the contract (```contract_a```):

```shell
cd cross_contract
cd contract_a
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Now navigate back to the example directory and deploy the ```contract_a``` in the soroban cli:

Hint: it is important to use the soroban cli in the main directory of the example because when executed, it adds a ```.soroban``` folder to store its data (e.g. deployed contracts).

```shell
cd ..
soroban deploy --wasm contract_a/build/release.wasm
```

You should see an output similar to this:
```shell
1f93b99bbd17a11ca22c05763b0c3296a7617af46835bb590105b2b154aefb18
```
representing the id of the contract that has been deployed.

Next navigate to the dicrectory of the second contract (```contract_b```) and install the sdk.

```shell
cd contract_b
npm install as-soroban-sdk
````

Before we build the contract_b, we need to replace the contract id to be called in the source code of ```contract_b```. 
Open the contract_b/assembly/index.ts file and replace the contract id in the code. Paste the contract id of ```contract_a``` that you received as you deployed it.

```typescript
let contractId = "1f93b99bbd17a11ca22c05763b0c3296a7617af46835bb590105b2b154aefb18";
```

Next, build ```contract_b```:

```shell
asc assembly/index.ts --target release
```

Now navigate back to the example directory and invoke ```contract_b``` in the soroban cli:

```shell
cd ..
soroban invoke --wasm contract_b/build/release.wasm --id 19 --fn callc
```

You should see following output:
```shell
15
```

```contract_b``` called ```contract_a``` and forwarded the result of the called function.


## Code

You can find the code of ```contract_a``` in:

```shell
cross_contract/contract_a/assembly/index.ts
```
It contains a simple function that applies the + operation to 2 integers received as arguments and returns the result.

The code of ```contract_a``` can be found in:

```shell
cross_contract/contract_b/assembly/index.ts
```


```typescript
import * as val from 'as-soroban-sdk/lib/value';
import { Vec } from "as-soroban-sdk/lib/vec";
import * as contract from "as-soroban-sdk/lib/contract";

export function callc(): val.RawVal {

  let contractId = "1f93b99bbd17a11ca22c05763b0c3296a7617af46835bb590105b2b154aefb18";
  let func = "add";
  let args = new Vec();
  args.pushBack(val.fromI32(3));
  args.pushBack(val.fromI32(12));

  return contract.callContractById(contractId, func, args.getHostObject());
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract/contract_b

## How it works

The ```contract.callContractById``` method, provided by [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk), allows the contract to call another contracts function.

It needs the id of the contract to be called, the name of the function to be executed and it's arguments packed in a vector.
