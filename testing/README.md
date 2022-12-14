# Testing

The [testing example](https://github.com/Soneso/as-soroban-examples/tree/main/testing) demonstrates how to create a simple test so that you can test a contract function. The example is an extension for the [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add).


## Run the example

To run a contract in the sandbox, you must first install the official ```soroban cli``` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```shell
cd testing
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Run the example contract:

```shell
soroban invoke --wasm build/release.wasm --id 1 --fn add --arg 1 --arg 5
```

You should see the output:
```shell
6
```

## Test

In this example we created the ```testContract.cjs``` file in the main folder. We will execute it using node. 

## Code

```javascript
const { exec } = require("child_process");
var assert = require('assert');

exec("soroban invoke --id 1 --wasm build/release.wasm --fn add --arg 1 --arg 5", (error, stdout, stderr) => {
    if (error) {
        assert.fail('error: ${error.message}');
    }
    if (stderr) {
        assert.fail('stderr: ${stderr}');
    }
    assert.equal(stdout, 6);
    console.log('OK');
});
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/testing/testContract.cjs

## Run

```shell
node testContract.cjs
```

You should see the output:
```shell
OK
```

## How it works

The script exectues the soroban comand and then checks the result.


## Further example

A more comprehensive example can be found in the [as-soroban-sdk Tests](https://github.com/Soneso/as-soroban-sdk/blob/main/test.cjs).