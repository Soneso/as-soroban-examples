const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const adminSeed = 'SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM'; 
const rpcUrl = ' --rpc-url https://rpc-futurenet.stellar.org';
const networkPassphrase = ' --network-passphrase "Test SDF Future Network ; October 2022"';


async function startTest() {
    await buildContract();
    let contractId = await deployContract();
    console.log('contract id: ' + contractId);
    await invokeContract(contractId);

}

async function buildContract() {
    console.log(`building contract ...`);
    const { error, stdout, stderr } = await exec('npm run asbuild:release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stdout);
}

async function deployContract() {
    console.log(`deploying contract ...`);

    let cmdDeploy = 'soroban contract deploy' + rpcUrl + networkPassphrase + ' --wasm build/release.wasm';

    const { error, stdout, stderr } = await exec(cmdDeploy);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let cId = stdout.trim();
    return cId;
}

async function invokeContract(contractId) {
    console.log(`invoking contract ...`);
    let cmdInvoke = 'soroban contract invoke' + rpcUrl + networkPassphrase + ' --source-account ' + adminSeed + ' --id ' + contractId + '  -- add --a 1 --b 5';
    exec(cmdInvoke, (error, stdout, stderr) => {
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
        assert.equal(stdout, 6);
        console.log(`OK`);
    });
}

startTest()