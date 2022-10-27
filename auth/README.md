# Auth

The [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth) demonstrates how to tell who has invoked a contract, and verify that a contract has been invoked by an account or contract. This example is an extension of the [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract in the sandbox, you must first install the official ```soroban-cli``` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

The example contains two contracts. To run them, navigate in the directory of the first contract and build the contract (```contract_a```):

```shell
cd auth
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
45a5e4697fcd38ec0654ea477a751ccc9b6d8eaa45d8c848678a87c02a43db53
```
representing the id of the contract that has been deployed.

Next navigate to the dicrectory of the second contract (```contract_b```) and install the sdk.

```shell
cd contract_b
npm install as-soroban-sdk
````

Before we build the contract_b, we need to replace the contract id to be called in the source code of ```contract_b```. 
Open the ```contract_b/assembly/index.ts``` file and replace the contract id in the code. Paste the contract id of ```contract_a``` that you received as you deployed it.

```typescript
let contractId = "45a5e4697fcd38ec0654ea477a751ccc9b6d8eaa45d8c848678a87c02a43db53";
```

Next, build ```contract_b```:

```shell
asc assembly/index.ts --target release
```

Now navigate back to the example directory and invoke ```contract_b``` in the soroban cli:

```shell
cd ..
soroban invoke --wasm contract_b/build/release.wasm --id 19 --fn callAuth
```

You should see an output similar to this:
```shell
[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25],1]
```

```contract_b``` called ```contract_a``` 's ```auth```function and forwarded the output. If you invoke the contract multiple times like this, the counter value increases.

Next invoke ```contract_a``` directly with the soroban-cli using an account id:

```shell
soroban invoke --id 45a5e4697fcd38ec0654ea477a751ccc9b6d8eaa45d8c848678a87c02a43db53 --account GBX2MZM4HIUK4QQ4F37SIAAILKS2QAUSTYAM4IXMXTPND2L6TCV4FZAS --fn auth
```

You should see an output similar to this:
```shell
["GBX2MZM4HIUK4QQ4F37SIAAILKS2QAUSTYAM4IXMXTPND2L6TCV4FZAS",1]
```

If you invoke the contract multiple times like this, the counter value increases.

## Code

You can find the code of ```contract_a``` in:

```shell
auth/contract_a/assembly/index.ts
```
It contains the function ```auth()``` that only reads and writes data for the authenticated invoker, and so the only thing that can access or change the data for an invoker, is the invoker themselves.

The code of ```contract_a``` can be found in:

```shell
cross_contract/contract_b/assembly/index.ts
```


```typescript
import {RawVal, fromU32, toU32} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';
import * as ledger from 'as-soroban-sdk/lib/ledger';
import * as context from 'as-soroban-sdk/lib/context';

export function auth(): RawVal {

  let key = context.getInvokerType() == 0 ? context.getInvokingAccount() : context.getInvokingContract();

  var counter = 0;
  if (ledger.hasData(key)) {
    let dataObj = ledger.getData(key);
    counter = toU32(dataObj);
  }
  counter += 1;
  let counterObj = fromU32(counter);
  ledger.putData(key, counterObj);

  let vec = new Vec();
  vec.pushFront(key);
  vec.pushBack(counterObj);

  return vec.getHostObject();
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/auth/contract_a

## How it works

The ```auth``` function first checks the invoker type using the ```getInvokerType()``` function provided by the sdk. If it returns ```0``` the invoker is an account. If it returns ```1``` the invoker is a contract. 

Depending on the invoker type, it sets the key for data storage (see [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment)), being the invoking account or the invoking contract:

```typescript
let key = context.getInvokerType() == 0 ? context.getInvokingAccount() : context.getInvokingContract();
```
To do so it uses the ```getInvokingAccount()``` and ```getInvokingContract()``` functions provided by the sdk.

Next it reads, increments and stores the counter for the invoker and returns a vector containing the key and the new counter value for the invoker.
