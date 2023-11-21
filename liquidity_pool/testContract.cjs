const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = "'Test SDF Network ; September 2015'";
const adminSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57";
const adminId = "GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T";
const userSeed = "SBY2KFCZM6YDWLT5GXHWAC2BOEPFFFDCRZ4RR7LHTMZ6DGJRSG7QROAW";
const userId = "GCSMOB3UZSQ37DBX5H6LHIBPTNWO6DSBC4LR5NK2LEKFZEEAQVA477ET";

async function startTest() {
    console.log(`test liquidity pool ...`);
    
    await buildLPContract();
    let lp_addr = await deployLPContract();
    //await pipInstallPythonSDK()
    let lp_cid = await idForContractAddress(lp_addr);
    console.log("lp addr: " + lp_addr);
    console.log("lp cid: " + lp_cid);

    await buildTokenContract();
    let wasm_hash = await installTokenContract();
    console.log("wasm hash: " + wasm_hash);
    let token_a_addr = await deployTokenContract();
    let token_b_addr = await deployTokenContract();
    let token_cid_a = await idForContractAddress(token_a_addr);
    let token_cid_b = await idForContractAddress(token_b_addr);
    if (token_cid_a > token_cid_b) {
        let tmp_addr = token_b_addr;
        let tmp_cid = token_cid_b;
        token_b_addr = token_a_addr;
        token_cid_b = token_cid_a;
        token_a_addr = tmp_addr;
        token_cid_a = tmp_cid;
    }
    
    console.log("token a addr: " + token_a_addr);
    console.log("token a cid: " + token_cid_a);
    console.log("token b addr: " + token_b_addr);
    console.log("token b cid: " + token_cid_b);

    await initializeLP(lp_cid, wasm_hash, token_a_addr, token_b_addr);
    let share_addr = await get_share_addr(lp_cid);
    let share_id = await idForContractAddress(share_addr);
    console.log("share addr: " + share_addr);
    console.log("share cid: " + share_id);

    // create tokens
    await createToken(token_cid_a, "544f4b454e41", "544f4b454e41"); // "TOKENA"
    await createToken(token_cid_b, "544f4b454e42", "544f4b454e42"); // "TOKENB"


    await mint(userId, 1000, token_cid_a);
    let balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"1000"');

    await mint(userId, 1000, token_cid_b);
    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"1000"');

    await depositLP(lp_cid, 100, 100, 100, 100);
    balance = await getBalance(userId, share_id);
    assert.equal(balance, '"100"');

    balance = await getBalance(lp_addr, share_id);
    assert.equal(balance, '"0"');

    balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"900"');

    balance = await getBalance(lp_addr, token_cid_a);
    assert.equal(balance, '"100"');

    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"900"');

    balance = await getBalance(lp_addr, token_cid_b);
    assert.equal(balance, '"100"');
    
    console.log('deposit ok');

    await swapLP(lp_cid, 0, 49, 100); // replace 0 with false as soon as the cli accepts it

    balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"803"');
    balance = await getBalance(lp_addr, token_cid_a);
    assert.equal(balance, '"197"');
    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"949"');
    balance = await getBalance(lp_addr, token_cid_b);
    assert.equal(balance, '"51"');

    console.log('swap ok');

    await withdrawLP(lp_cid, 100, 197, 51);

    balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"1000"');
    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"1000"');
    balance = await getBalance(userId, share_id);
    assert.equal(balance, '"0"');


    balance = await getBalance(lp_addr, token_cid_a);
    assert.equal(balance, '"0"');
    balance = await getBalance(lp_addr, token_cid_b);
    assert.equal(balance, '"0"');
    balance = await getBalance(lp_addr, share_id);
    assert.equal(balance, '"0"');

    console.log('withdraw ok');

    console.log('test liquidity pool -> OK');
} 


async function buildLPContract() {
    const { error, stdout, stderr } = await exec('npm run asbuild:release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("buildLPContract - stderr: " + stderr);
    }
    console.log(stdout);
}

async function deployLPContract() {
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
        console.log("deployLPContract - stderr: " + stderr);
    }
    return stdout.trim(); // contract id
}

async function buildTokenContract() {
    const { error, stdout, stderr } = await exec('cd ../token && npm run asbuild:release && cd ../liquidity_pool');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function installTokenContract() {
    const { error, stdout, stderr } = await exec('soroban contract install --wasm ../token/build/release.wasm ' + 
    '--source ' + adminSeed + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("installTokenContract - stderr: " + stderr);
    }
    return stdout.trim(); // wasm id
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
        console.log("deployTokenContract - stderr: " + stderr);
    }
    return stdout.trim(); // contract address
}

async function initializeLP(lp_contract_id, token_wasm_hash , token_a, token_b) {
    let cmd = 'soroban -q contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- initialize --token_wasm_hash ' + token_wasm_hash 
    + ' --token_a '+ token_a + ' --token_b ' + token_b;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("initializeLP - stderr: " + stderr);
    }
    return stdout.trim();
}

async function depositLP(lp_contract_id, desired_a, min_a, desired_b, min_b) {
    let cmd = 'soroban -q contract invoke --source ' + userSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' --fee 1000000 -- deposit --to ' + userId 
    + ' --desired_a '+ desired_a + ' --min_a ' + min_a
    + ' --desired_b '+ desired_b + ' --min_b ' + min_b;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("depositLP - stderr: " + stderr);
    }
    return stdout.trim();
}

async function swapLP(lp_contract_id, buy_a, out, in_max) {
    let cmd = 'soroban -q contract invoke --source ' + userSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' --fee 1000000 -- swap --to ' + userId 
    + ' --buy_a '+ buy_a + ' --out ' + out
    + ' --in_max '+ in_max;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("swapLP - stderr: " + stderr);
    }
    return stdout.trim();
}

async function withdrawLP(lp_contract_id, share_amount, min_a, min_b) {
    let cmd = 'soroban -q contract invoke --source ' + userSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' --fee 1000000 -- withdraw --to ' + userId 
    + ' --share_amount '+ share_amount + ' --min_a ' + min_a
    + ' --min_b '+ min_b;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("withdrawLP - stderr: " + stderr);
    }
    return stdout.trim();
}

async function get_share_addr(lp_contract_id) {
    let cmd = 'soroban -q contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- share_addr';

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("get_share_addr - stderr: " + stderr);
    }
    return stdout.trim();
}

async function createToken(token_contract_id, name , symbol) {
    let cmd = 'soroban -q contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id 
    + ' -- initialize --admin ' + adminId 
    + ' --decimal 8 --name '+ name + ' --symbol ' + symbol;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("createToken - stderr: " + stderr);
    }
    return stdout.trim();
}

async function mint(to, amount, token_contract_id) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke' + 
    ' --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id + ' -- mint --to ' + to + ' --amount ' + amount);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("mint - stderr: " + stderr);
    }
    return stdout.trim();
}

async function getBalance(user, token_contract_id) {
    let cmd = 'soroban -q contract invoke ' +
    '--source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + token_contract_id + ' -- balance --id ' + user;

    const { error, stdout, stderr } = await exec(cmd);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("getBalance - stderr: " + stderr);
    }
    return stdout.trim(); // balance
}

async function pipInstallPythonSDK() {
    let pip = 'pip3 install git+https://github.com/StellarCN/py-stellar-base.git'; // 'pip3 install -U stellar-sdk'
    const { error, stdout, stderr } = await exec(pip);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("pipInstallPythonSDK - stderr: " + stderr);
    }
    console.log(stdout);
}

async function idForContractAddress(contract_address) {
    let cmd = 'python3 contract_id.py '  + contract_address;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("ID to ADD -stderr: " + stderr);
    }
    return stdout.trim();
}


startTest()