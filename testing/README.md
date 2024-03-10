# Testing

The [testing example](https://github.com/Soneso/as-soroban-examples/tree/main/testing) demonstrates how to create a simple test so that you can test a contract function. The example is an extension for the [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add).


## Run the example

To run a contract, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked soroban-cli
```

Then, to run the example, navigate to its directory and install the sdk. Then build the contract:

```sh
cd testing
npm install
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the ```build``` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Deploy the example contract:

```sh
soroban contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

This returns the ID of the contract, starting with a C. Similar to this:

```sh
CBTANHY2MOMQRV7HBGAZMCWHFS7R2ZQMCLZRE7JETIL3M6LSDTM2EVU5
```

Next let's invoke:

```sh
soroban -q contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- add --a 1 --b 5
```

You should see the output:
```sh
6
```

## Test

In this example we created the `testContract.cjs` file in the main folder. We will execute it using node. 

## Code

```javascript
const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const adminSeed = 'SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM';
const rpcUrl = ' --rpc-url https://soroban-testnet.stellar.org';
const networkPassphrase = ' --network-passphrase "Test SDF Network ; September 2015"';


async function startTest() {
    await buildContract();
    let contractId = await deployContract();
    console.log('contract id: ' + contractId);
    await invokeContract(contractId);

}

async function buildContract() {
    console.log(`building contract ...`);
    const {error, stdout, stderr} = await exec('npm run asbuild:release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stdout);
}

async function deployContract() {
    console.log(`deploying contract ...`);

    let cmdDeploy = 'soroban contract deploy' + rpcUrl + networkPassphrase +
        ' --wasm build/release.wasm';

    const {error, stdout, stderr} = await exec(cmdDeploy);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let cId = stdout.trim();
    return cId;
}

async function invokeContract(contractId) {
    console.log(`invoking contract ...`);
    let cmdInvoke = 'soroban contract invoke' + rpcUrl + networkPassphrase +
        ' --source-account ' + adminSeed +
        ' --id ' + contractId +
        '  -- add --a 1 --b 5';
    exec(cmdInvoke, (error, stdout, stderr) => {
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
        assert.equal(stdout, 6);
        console.log(`OK`);
    });
}

startTest()
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

The script first builds and deploys the contract, then invokes the add function and checks the result.

## Using logging and events

We can also use logging and events to test our contracts. See [logging example](https://github.com/Soneso/as-soroban-examples/tree/main/logging) and [events example](https://github.com/Soneso/as-soroban-examples/blob/main/contract_events/README.md). 

## Further readings

More comprehensive testing examples can be found here:
- in the [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token)
- in the [single offer example](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer)
- in the [liquidity pool example](https://github.com/Soneso/as-soroban-examples/tree/main/liquidity_pool)
- in the [timelock example](https://github.com/Soneso/as-soroban-examples/tree/main/timelock)
- in the [as-soroban-sdk tests](https://github.com/Soneso/as-soroban-sdk/blob/main/test.cjs).