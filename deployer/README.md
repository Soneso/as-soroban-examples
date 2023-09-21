# Deployer

The [deployer example](https://github.com/Soneso/as-soroban-examples/tree/main/deployer) demonstrates how to deploy contracts using a contract.


## Run the example

To run a contract in the sandbox, you must first install the official `soroban cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

### Install the `add` contract
Before deploying the new contract instances, the WASM code needs to be installed on-chain. Then it can be used to deploy an arbitrary number of contract instances. The installation should typically happen outside of the deployer contract, as it needs to happen just once, while the deployer contract can be called multiple times.


In this example we are going to install the [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add). First navigate to its directory and build it:

```sh
cd add
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

Next install the `add` contract:

```sh
cd ..
cd deployer
soroban contract install --wasm ../add/build/release.wasm
```

As an output you will get the wasm hash of the installed `add` contract, similar to this:
```sh
0f3d90bc518e8589231fdf374cd860c621fa6a740e1099821413057ebcb847d0
```

### Deploy

The deployer contract deploys other contracts. It accepts a hash-based identifier of the installed WASM and a salt that will be used to derive a contract ID. In this example, it also accepts a function name and arguments to be called after the contract has been deployed.

Lets deploy the `add` contract and execute its `add(...)` function after deploy.

First navigate to the deployer directory, install the SDK and build the deployer contract:

```sh
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

Next execute the deployer contract (change the wash_hash in the command first):

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
import * as ledger from "as-soroban-sdk/lib/ledger";
import * as contract from "as-soroban-sdk/lib/contract";
import * as context from "as-soroban-sdk/lib/context";

export function deploy(wasm_hash: BytesObject, salt: BytesObject, 
                      fn_name: SmallSymbolVal, args:VecObject): I32Val {

  let currentContractAddress = context.getCurrentContractAddress();
  let id = ledger.deployContract(currentContractAddress, wasm_hash, salt);
  return contract.callContract(id, fn_name, args);
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/deployer

## How it works

The contract calls the SDK function `ledger.deployContract(...)` with the obtained wasm_hash and salt. The contract ID for the new contract is returned. The implementation of the new contract is defined by the WASM file installed under wasm_hash (only the wasm_hash itself is stored per contract ID thus saving the ledger space and fees).

The contract ID is deterministic and is derived from the deploying contract and the salt.

```typescript
let id = ledger.deployContract(currentContractAddress, wasm_hash, salt);
```

Next, deployer contract invokes the `add` contract's function and passes through the arguments.

```typescript
return contract.callContract(id, fn_name, args);
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
            "value" : "0.2.5"
        },
        {
            "key" : "description",
            "value" : "this example deploys and invokes a contract"
        }
    ]
}
```
