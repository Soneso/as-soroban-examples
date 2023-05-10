const util = require('util');
const exec = util.promisify(require('child_process').exec);
var assert = require('assert');

const rpcUrl = 'https://horizon-futurenet.stellar.cash:443/soroban/rpc';
const networkPassphrase = "'Test SDF Future Network ; October 2022'";
const adminSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57";
const adminId = "GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T";

const a1Id = "GBDVESQUNQZTQ67BS6RVATSIAGYNWNO6JQY4KA6V5WNSZ3KXSEWOCMCL";
const a1Amount = 2000;

const a2Id = "GAX5T5KKYTXDRRRQHOQNEW2HUIFP6V52QYFUVII6TEKHJDLUXUJ3WW3J";
const a2Amount = 3000;

const a3Id = "GDB65H47NTZKRLOOU2GVHPHFWWTJEQDCYDZOUFAAADMN3W6NEBEAX62Z";
const a3Amount = 4000;

const b1Id = "GCNTVAJRMHUZUNFTZOICCZUPZN64AU5BNHPITMEYLE5HZPM6IWUBLDI3";
const b1Amount = 300;

const b2Id = "GAQ2SGHA46WT3LQO5XNDBVBCJEBCNQYLK7EKFB4SAP42Y6IBEI566DZZ";
const b2Amount = 295;

const b3Id = "GDXEWCCLZDQVXQR7HIKJ7JGHGZE6EF3DAJYHPGKM7IAMVS7O4MPVDDHF";
const b3Amount = 400;


async function startTest() {
    console.log(`test multi swap ...`);
    
    await buildMultiSwapContract();
    let multi_swap_cid = await deployMultiSwapContract();
    console.log("multi cid: " + multi_swap_cid);

    await buildAtomicSwapContract();
    let atomic_swap_cid = await deployAtomicSwapContract();
    console.log("atomic cid: " + atomic_swap_cid);

    await buildTokenContract();
    let token_a_cid = await deployTokenContract();
    console.log("token a cid: " + token_a_cid);
    let token_b_cid = await deployTokenContract();
    console.log("token b cid: " + token_b_cid);

    // create tokens
    await createToken(token_a_cid, "544f4b454e41", "544f4b454e41"); // "TOKENA"
    await createToken(token_b_cid, "544f4b454e42", "544f4b454e42"); // "TOKENB"


    await mint(a1Id, a1Amount, token_a_cid);
    var balance = await getBalance(a1Id, token_a_cid);
    assert.equal(balance, '"' + a1Amount + '"');
    console.log("minted : " + a1Amount + " TOKENA to a1");

    await mint(a2Id, a2Amount, token_a_cid);
    var balance = await getBalance(a2Id, token_a_cid);
    assert.equal(balance, '"' + a2Amount + '"');
    console.log("minted : " + a2Amount + " TOKENA to a2");

    await mint(a3Id, a3Amount, token_a_cid);
    var balance = await getBalance(a3Id, token_a_cid);
    assert.equal(balance, '"' + a3Amount + '"');
    console.log("minted : " + a3Amount + " TOKENA to a3");

    await mint(b1Id, b1Amount, token_b_cid);
    var balance = await getBalance(b1Id, token_b_cid);
    assert.equal(balance, '"' + b1Amount + '"');
    console.log("minted : " + b1Amount + " TOKENB to b1");

    await mint(b2Id, b2Amount, token_b_cid);
    var balance = await getBalance(b2Id, token_b_cid);
    assert.equal(balance, '"' + b2Amount + '"');
    console.log("minted : " + b2Amount + " TOKENB to b2");

    await mint(b3Id, b3Amount, token_b_cid);
    var balance = await getBalance(b3Id, token_b_cid);
    assert.equal(balance, '"' + b3Amount + '"');
    console.log("minted : " + b3Amount + " TOKENB to b3");

    await pipInstallPythonSDK();
    let result = await pyMultiSwap(multi_swap_cid, atomic_swap_cid, token_a_cid, token_b_cid);
    assert.equal('Function result: <SCVal [type=1]>', result);
    console.log(`test atomic swap -> OK`);
} 

async function pipInstallPythonSDK() {
    let pip = 'pip3 install git+https://github.com/StellarCN/py-stellar-base.git@soroban'; // 'pip3 install -U stellar-sdk'
    const { error, stdout, stderr } = await exec(pip);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log(stderr);
    }
    console.log(stdout);
}

async function pyMultiSwap(multi_swap_cid, swap_cid, token_a_cid, token_b_cid) {
    let cmd = 'python3 multi_swap_test.py '  + multi_swap_cid + ' ' + swap_cid + ' ' + token_a_cid + ' ' + token_b_cid;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log(stderr);
    }
    return stdout.trim();
}

async function buildMultiSwapContract() {
    const { error, stdout, stderr } = await exec('asc assembly/index.ts --target release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function deployMultiSwapContract() {
    let cmd = 'soroban contract deploy'
    + ' --wasm build/release.wasm' + 
    ' --source ' + adminSeed + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        if (!stderr.startsWith("SUCCESS")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("SUCCESS"), true );
    }
    return stdout.trim(); // contract id
}

async function buildTokenContract() {
    const { error, stdout, stderr } = await exec('cd ../token && asc assembly/index.ts --target release && cd ../multi_swap');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function deployTokenContract() {
    const { error, stdout, stderr } = await exec('soroban contract deploy --wasm ../token/build/release.wasm ' + 
    '--source ' + adminSeed + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        if (!stderr.startsWith("SUCCESS")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("SUCCESS"), true );
    }
    return stdout.trim(); // contract id
}

async function buildAtomicSwapContract() {
    const { error, stdout, stderr } = await exec('cd ../atomic-swap && asc assembly/index.ts --target release && cd ../multi_swap');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function deployAtomicSwapContract() {
    const { error, stdout, stderr } = await exec('soroban contract deploy --wasm ../atomic-swap/build/release.wasm ' + 
    '--source ' + adminSeed + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        if (!stderr.startsWith("SUCCESS")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("SUCCESS"), true );
    }

    return stdout.trim(); // contract id
}

async function createToken(token_contract_id, name , symbol) {
    let cmd = 'soroban contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id 
    + ' -- initialize --admin ' + adminId 
    + ' --decimal 8 --name '+ name + ' --symbol ' + symbol;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        if (!stderr.startsWith("SUCCESS")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("SUCCESS"), true );
    }
    return stdout.trim();
}

async function mint(to, amount, token_contract_id) {
    const { error, stdout, stderr } = await exec('soroban contract invoke' + 
    ' --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id + ' -- mint --admin ' + adminId +' --to ' + to + ' --amount ' + amount);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        if (!stderr.startsWith("SUCCESS")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("SUCCESS"), true );
    }
    return stdout.trim();
}

async function getBalance(user, token_contract_id) {
    let cmd = 'soroban contract invoke ' +
    '--source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + token_contract_id + ' -- balance --id ' + user;

    const { error, stdout, stderr } = await exec(cmd);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        if (!stderr.startsWith("SUCCESS")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("SUCCESS"), true );
    }
    return stdout.trim(); // balance
}

startTest()