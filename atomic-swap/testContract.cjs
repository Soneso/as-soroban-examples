const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const rpcUrl = 'https://rpc-futurenet.stellar.org';
const networkPassphrase = "'Test SDF Future Network ; October 2022'";
const submitterSeed = "SDO7H2BPXKB6JHCT7ZFVM7MJWHS6FC7KIX5RO37J65UAVMOEK37TS4RR"; // GBXNHLEJEZSQEQSTJRLZ4F5JFJOC7VAS3AM72SIQUXLGYL6DFACZZKI5

async function startTest() {
    console.log(`test atomic swap ...`);
    await buildSwapContract();
    let swap_contract_id = await deploy_swap_contract(submitterSeed);
    await pipInstallPythonSDK();
    let result = await pySwap(swap_contract_id);
    assert.equal('swap success', result);
    console.log(`test atomic swap -> OK`);
} 

async function pipInstallPythonSDK() {
    let pip = 'pip3 install git+https://github.com/StellarCN/py-stellar-base.git'; // 'pip3 install -U stellar-sdk'
    const { error, stdout, stderr } = await exec(pip);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log(stderr);
    }
    console.log(stdout);
}

async function pySwap(swap_contract_id) {
    let cmd = 'python3 swap_test.py '  + swap_contract_id;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log(stderr);
    }
    return stdout.trim();
}

async function buildSwapContract() {
    const { error, stdout, stderr } = await exec('npm run asbuild:release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function deploy_swap_contract(key) {
    let cmd = 'soroban contract deploy'
    + ' --wasm build/release.wasm' + 
    ' --source ' + key + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("deploy_swap_contract - stderr: " + stderr);
    }
    console.log("swap contract id: " + stdout);
    return stdout.trim(); // contract address
}

startTest()