const util = require('util');
const exec = util.promisify(require('child_process').exec);
var assert = require('assert');

const rpcUrl = 'https://rpc-futurenet.stellar.org:443';
const networkPassphrase = "'Test SDF Future Network ; October 2022'";
const adminSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57";
const adminId = "GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T";
const userSeed = "SBY2KFCZM6YDWLT5GXHWAC2BOEPFFFDCRZ4RR7LHTMZ6DGJRSG7QROAW";
const userId = "GCSMOB3UZSQ37DBX5H6LHIBPTNWO6DSBC4LR5NK2LEKFZEEAQVA477ET";

async function startTest() {
    console.log(`test liquidity pool ...`);
    
    await buildLPContract();
    let lp_cid = await deployLPContract();
    console.log("lp cid: " + lp_cid);

    await buildTokenContract();
    let wasm_hash = await installTokenContract();
    console.log("wasm hash: " + wasm_hash);
    var token_cid_a = await deployTokenContract();
    var token_cid_b = await deployTokenContract();
    if (token_cid_a > token_cid_b) {
        let tmp = token_cid_b;
        token_cid_b = token_cid_a;
        token_cid_a = tmp;
    }
    console.log("token a cid: " + token_cid_a);
    console.log("token b cid: " + token_cid_b);

    await initializeLP(lp_cid, wasm_hash, token_cid_a, token_cid_b);
    let share_id = await get_share_id(lp_cid);
    console.log("share cid: " + share_id);

    // create tokens
    await createToken(token_cid_a, "544f4b454e41", "544f4b454e41"); // "TOKENA"
    await createToken(token_cid_b, "544f4b454e42", "544f4b454e42"); // "TOKENB"


    await mint(userId, 1000, token_cid_a);
    var balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"1000"');

    await mint(userId, 1000, token_cid_b);
    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"1000"');

    await depositLP(lp_cid, 100, 100, 100, 100);
    balance = await getBalance(userId, share_id);
    assert.equal(balance, '"100"');

    await pipInstallPythonSDK()
    let lp_contract_address = await addressForContractId(lp_cid);

    balance = await getBalance(lp_contract_address, share_id);
    assert.equal(balance, '"0"');

    balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"900"');

    balance = await getBalance(lp_contract_address, token_cid_a);
    assert.equal(balance, '"100"');

    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"900"');

    balance = await getBalance(lp_contract_address, token_cid_b);
    assert.equal(balance, '"100"');
    
    console.log('deposit ok');

    await swapLP(lp_cid, 0, 49, 100); // replace 0 with false as soon as the cli accepts it

    balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"803"');
    balance = await getBalance(lp_contract_address, token_cid_a);
    assert.equal(balance, '"197"');
    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"949"');
    balance = await getBalance(lp_contract_address, token_cid_b);
    assert.equal(balance, '"51"');

    console.log('swap ok');

    await withdrawLP(lp_cid, 100, 197, 51);

    balance = await getBalance(userId, token_cid_a);
    assert.equal(balance, '"1000"');
    balance = await getBalance(userId, token_cid_b);
    assert.equal(balance, '"1000"');
    balance = await getBalance(userId, share_id);
    assert.equal(balance, '"0"');


    balance = await getBalance(lp_contract_address, token_cid_a);
    assert.equal(balance, '"0"');
    balance = await getBalance(lp_contract_address, token_cid_b);
    assert.equal(balance, '"0"');
    balance = await getBalance(lp_contract_address, share_id);
    assert.equal(balance, '"0"');

    console.log('withdraw ok');

    console.log('test liquidity pool -> OK');
} 


async function buildLPContract() {
    const { error, stdout, stderr } = await exec('asc assembly/index.ts --target release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //assert.fail(`stderr: ${stderr}`);
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

async function installTokenContract() {
    const { error, stdout, stderr } = await exec('soroban contract install --wasm ../token/build/release.wasm ' + 
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
        if (!stderr.startsWith("SUCCESS")) {
            console.log(stderr);
        }
        assert.equal(stderr.startsWith("SUCCESS"), true );
    }
    return stdout.trim(); // contract id
}

async function initializeLP(lp_contract_id, token_wasm_hash , token_a, token_b) {
    let cmd = 'soroban contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- initialize --token_wasm_hash ' + token_wasm_hash 
    + ' --token_a '+ token_a + ' --token_b ' + token_b;

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

async function depositLP(lp_contract_id, desired_a, min_a, desired_b, min_b) {
    let cmd = 'soroban contract invoke --source ' + userSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- deposit --to ' + userId 
    + ' --desired_a '+ desired_a + ' --min_a ' + min_a
    + ' --desired_b '+ desired_b + ' --min_b ' + min_b;

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

async function swapLP(lp_contract_id, buy_a, out, in_max) {
    let cmd = 'soroban contract invoke --source ' + userSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- swap --to ' + userId 
    + ' --buy_a '+ buy_a + ' --out ' + out
    + ' --in_max '+ in_max;

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

async function withdrawLP(lp_contract_id, share_amount, min_a, min_b) {
    let cmd = 'soroban contract invoke --source ' + userSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- withdraw --to ' + userId 
    + ' --share_amount '+ share_amount + ' --min_a ' + min_a
    + ' --min_b '+ min_b;

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

async function get_share_id(lp_contract_id) {
    let cmd = 'soroban contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- share_id';

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
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id + ' -- mint --to ' + to + ' --amount ' + amount);

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

async function addressForContractId(contract_id) {
    let cmd = 'python3 contract_address.py '  + contract_id;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log(stderr);
    }
    return stdout.trim();
}

startTest()