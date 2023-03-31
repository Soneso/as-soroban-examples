const util = require('util');
const exec = util.promisify(require('child_process').exec);
var assert = require('assert');

const rpcUrl = 'https://horizon-futurenet.stellar.cash:443/soroban/rpc';
const networkPassphrase = "'Test SDF Future Network ; October 2022'";
const submitterSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57"; // GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T

async function startTest() {
    console.log(`test atomic swap ...`);
    await buildSwapContract();
    let swap_contract_id = await deploy_swap_contract(submitterSeed);
    await pipInstallPythonSDK();
    let result = await pySwap(swap_contract_id);
    assert.equal("transaction result: <SCVal [type=3, ic=0]>", result);
    console.log(`test atomic swap -> OK`);
} 

async function pipInstallPythonSDK() {
    const { error, stdout, stderr } = await exec('pip3 install -U stellar-sdk');
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
    const { error, stdout, stderr } = await exec('asc assembly/index.ts --target release');
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
    ' --secret-key ' + key + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        if (!stderr.startsWith("success")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("success"), true );
    }
    console.log("swap contract id: " + stdout);
    return stdout.trim(); // contract id
}

startTest()