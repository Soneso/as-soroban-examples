# Testing

The [testing example](https://github.com/Soneso/as-soroban-examples/tree/main/testing) demonstrates how to create a simple test so that you can test a contract function. The example is an extension for the [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add).


## Run the example

To run a contract in the sandbox, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli):

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

Then, to run the example, navigate to its directory and install the sdk. Then build the contract:

```sh
cd testing
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the ```build``` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Run the example contract:

```sh
soroban -q contract invoke --wasm build/release.wasm --id 1 -- add --a 1 --b 5
```

You should see the output:
```sh
6
```

## Test

In this example we created the `testContract.cjs` file in the main folder. We will execute it using node. 

## Code

```javascript
const { exec } = require("child_process");
var assert = require('assert');

exec("soroban contract invoke --id 1 --wasm build/release.wasm -- add --a 1 --b 5", (error, stdout, stderr) => {
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    assert.equal(stdout, 6);
    console.log(`OK`);
});
```


## Run

```sh
node testContract.cjs
```

You should see the output:
```sh
OK
```

## How it works

The script exectutes the soroban command and then checks the result.


## Further example

A more comprehensive example can be found:
- in the [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token)
- in the [single offer example](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer)
- in the [liquidity pool example](https://github.com/Soneso/as-soroban-examples/tree/main/liquidity_pool)
- in the [timelock example](https://github.com/Soneso/as-soroban-examples/tree/main/timelock)
- in the [as-soroban-sdk Tests](https://github.com/Soneso/as-soroban-sdk/blob/main/test.cjs).