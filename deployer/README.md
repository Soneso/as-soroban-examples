# Deployer

The [deployer example](https://github.com/Soneso/as-soroban-examples/tree/main/deployer) demonstrates how to deploy contracts using a contract.


## Run the example

To run a contract in the sandbox, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

### Install the `add` contract
Before deploying the new contract instances, the WASM code needs to be installed on-chain. Then it can be used to deploy an arbitrary number of contract instances. Read more about this 2-step deployment process [here](https://soroban.stellar.org/docs/getting-started/deploy-incrementor). 

The installation should typically happen outside of the deployer contract, as it needs to happen just once, while the deployer contract can be called multiple times.

In this example we are first going to install the contract WASM code from the [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add). 

First navigate to its directory and build it:

```sh
cd add
npm install as-soroban-sdk
npm run asbuild:release
```

Next, navigate to the deployer example directory:
```sh
cd ..
cd deployer
```

If you have already have executed this example in the past, remove the `.soroban` folder first, because it is not possible to re-deploy an already existing contract. 

```sh
rm -rf .soroban/
```

Next install the `add` contract's  WASM code:

```sh
soroban contract install --wasm ../add/build/release.wasm
```

As an output you will get the WASM hash of the installed `add` contract, like this:
```sh
0f3d90bc518e8589231fdf374cd860c621fa6a740e1099821413057ebcb847d0
```

### Deploy

The deployer contract deploys other contracts. It accepts a hash-based identifier of the installed WASM and a salt that will be used to derive a contract ID. In this example, it also accepts a function name and arguments to be invoked after the contract has been deployed.

Let's deploy the `add` contract and invoke its `add(...)` function after deploy.

First navigate to the deployer directory, install the SDK and build the deployer contract:

```sh
npm install as-soroban-sdk
npm run asbuild:release
```

Next invoke the deployer contract (change the wash_hash in the command first):

```sh
soroban -q contract invoke \
    --wasm build/release.wasm \
    --id 0 \
    -- deploy \
    --salt 0000000000000000000000000000000000000000000000000000000000000000 \
    --wasm_hash 0f3d90bc518e8589231fdf374cd860c621fa6a740e1099821413057ebcb847d0 \
    --fn_name add \
    --args '[3, 5]'
```

You should see the output:
```sh
8
```

## Code

You can find the code in:

```sh
deployer/assembly/index.ts
```

```typescript
import {BytesObject, I32Val, SmallSymbolVal, VecObject} from 'as-soroban-sdk/lib/value';
import * as env from "as-soroban-sdk/lib/env";

export function deploy(wasm_hash: BytesObject, salt: BytesObject, 
                      fn_name: SmallSymbolVal, args:VecObject): I32Val {

  let currentContractAddress = env.get_current_contract_address();
  let id = env.create_contract(currentContractAddress, wasm_hash, salt);
  return env.call(id, fn_name, args);
}
```

## How it works

The contract calls the SDK function `env.create_contract` with the address of the current contract and the obtained wasm_hash and salt. The contract ID for the new contract is returned. The implementation of the new contract is defined by the WASM file installed under wasm_hash (only the wasm_hash itself is stored per contract ID thus saving the ledger space and fees).

The contract ID is deterministic and is derived from the deploying contract and the salt.

```typescript
let id = env.create_contract(currentContractAddress, wasm_hash, salt);
```

Next, the deployer contract invokes the `add` contract's function and passes through the arguments.

```typescript
return env.call(id, fn_name, args);
```

You can read more about cross contract calls in the [cross_contract](https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract) example.


The concrete argument and return types of this example deployer contract are defined in it's [contract spec](https://github.com/Soneso/as-soroban-sdk#understanding-contract-metadata): `contract.json` file:

```json
{
    "functions": [
        {
            "name" : "deploy",
            "arguments": [
                {"name": "wasm_hash", "type": "bytesN[32]"},
                {"name": "salt", "type": "bytesN[32]"},
                {"name": "fn_name", "type": "symbol"},
                {"name": "args", "type": "vec[i32]"}
            ],
            "returns" : "i32"
        }
    ],
    "meta": [
        {
            "key" : "name",
            "value" : "deployer"
        },
        {
            "key" : "version",
            "value" : "0.3.0"
        },
        {
            "key" : "description",
            "value" : "this example deploys and invokes a contract"
        }
    ]
}
```

## Direct functions vs. wrapped

As you can see in the example code above, we used the directly exposed host functions by the SDK via [env.ts](https://github.com/Soneso/as-soroban-sdk/blob/main/lib/env.ts). However, the SDK also offers `wrapped` functions to do so. In the following example we use the `wrapped` functions to implement the deployer contract. This version of the deployer contract can be found here:

```sh
deployer/assembly/index2.ts
```

```typescript
import { BytesObject, I32Val, fromI32 } from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import * as contract from "as-soroban-sdk/lib/contract";
import * as context from "as-soroban-sdk/lib/context";
import { Bytes } from 'as-soroban-sdk/lib/bytes';
import { Vec } from 'as-soroban-sdk/lib/vec';

export function deploy2(wasm_hash: BytesObject): I32Val {

  let currentContractAddress = context.getCurrentContractAddress();

  // use SDK type "Bytes" and wrapped function
  let wasmHashBytes = new Bytes(wasm_hash);
  let pseudoSaltBytes = new Bytes();
  for (let i: u32 = 0; i < 32; i++) {
    pseudoSaltBytes.push(i);
  }

  let id = ledger.deployContract(currentContractAddress, wasmHashBytes, pseudoSaltBytes);

    // use string, the SDK type "Vec" and wrapped function
  let argsVec = new Vec();
  argsVec.pushBack(fromI32(7));
  argsVec.pushBack(fromI32(3));
  return contract.callContract(id, "add", argsVec);
}
```

Instead of using the host function `env.create_contract(currentContractAddress, wasm_hash, salt);` we use the `wrapped` function `ledger.deployContract(currentContractAddress, wasmHashBytes, saltBytes);`. Let's have a look to it's implementation:

```typescript
export function deployContract(deployer: AddressObject, wasmHash: Bytes, salt:Bytes) : AddressObject {
    return create_contract(deployer, wasmHash.getHostObject(), salt.getHostObject());
}
```

It accepts the `wasmHash` and `salt` as `Bytes` SDK Type, so that we have to create them first:

```typescript
let wasmHashBytes = new Bytes(wasm_hash);
let pseudoSaltBytes = new Bytes();
for (let i: u32 = 0; i < 32; i++) {
    pseudoSaltBytes.push(i);
}
```

Depending on your use case it might be a good idea to choose between directly exposed host functions and `wrapped` functions of the SDK. For example here, if you are building values within the contract and do not receive them as host values by parameter you can use the `wrapped` function. 

E.g., let's suppose that we do not have the function name ("add") as a host value from the parameter and want to hard code it into the contract:

```typescript
let argsVec = new Vec();
argsVec.pushBack(fromI32(7));
argsVec.pushBack(fromI32(3));
return contract.callContract(id, "add", argsVec);
```

The wrapped function `contract.callContract` accepts a string as input for the function name and a Vec for the args:

```typescript
export function callContract(contract: AddressObject, func: string, args: Vec): Val {
    return call(contract, fromSmallSymbolStr(func), args.getHostObject());
}
```

Next, let's run this contract:

```sh
rm -rf .soroban/
soroban contract install --wasm ../add/build/release.wasm
```

As an output you will get the wasm hash of the installed `add` contract, similar to this:
```sh
0f3d90bc518e8589231fdf374cd860c621fa6a740e1099821413057ebcb847d0
```

Build the new contract:

```sh
npm run asbuild2:release
```
This builds the contract from ```deployer/assembly/index2.ts```. see ```deployer/package.json```

Invoke:

```sh
soroban -q contract invoke \
    --wasm build/release.wasm \
    --id 0 \
    -- deploy2 \
    --wasm_hash 0f3d90bc518e8589231fdf374cd860c621fa6a740e1099821413057ebcb847d0
```

You should see the output:
```sh
10
```

