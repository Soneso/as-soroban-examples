const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

//const rpcUrl = 'https://soroban-testnet.stellar.org';
//const networkPassphrase = "'Test SDF Network ; September 2015'";

const rpcUrl = 'https://rpc-futurenet.stellar.org';
const networkPassphrase = "'Test SDF Future Network ; October 2022'";

const adminSeed = "SA4VZPUHRLEOPEPH5EDFHELYRUNRVHITYMX7MB5WFDCAEOPPCQVOEKYV";
const adminId = "GDNGXPMCVH5ZQUBWINCFFP4F2SEV3NFNFYCUZBZPIQA5QQPV2CJWUP7G";

const a1Id = "GBTZCGVLGSOZ2JO3WDZSPBC7W5K4HED5IPVE5M55GVKNSAUGDFD3JI4P";
const a1Amount = 2000;

const a2Id = "GB46L53KCLXZK7TBN7Y3T2C7AYU3UD4YSII6DZ7XP7XEHRKDPSTMVDXT";
const a2Amount = 3000;

const a3Id = "GBV22NUGMH4REN23ICZWAEWWVST62WAOQZHWJVCPYYOAOUPQ4MT4PH62";
const a3Amount = 4000;

const b1Id = "GCR3NBOPV7VDYMDSXYJ67N6YNOF2QETKT6QSP24KKVPW6ZQO2S3GJHUR";
const b1Amount = 300;

const b2Id = "GC32YYRYT3MPDQCNVHRB4ZWIOHL7L42VCJATE2ZU75Q7XESOWSDSJ7WU";
const b2Amount = 295;

const b3Id = "GDLTA3L4B7FPVV24RHTKP2RQGQREU4YAEF5XFPPRVS2RRLHMXLFI7AOP";
const b3Amount = 400;


async function startTest() {
    console.log(`test multi swap ...`);
    await pipInstallPythonSDK();
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
    await createToken(token_a_cid, "'Token A'", "TOKENA");
    await createToken(token_b_cid, "'Token B'", "TOKENB");


    await mint(a1Id, a1Amount, token_a_cid);
    var balance = await getBalance(a1Id, token_a_cid);
    assert.equal(balance, '"' + a1Amount + '"');
    console.log("minted : " + a1Amount + " TOKENA to a1");

    await mint(a2Id, a2Amount, token_a_cid);
    balance = await getBalance(a2Id, token_a_cid);
    assert.equal(balance, '"' + a2Amount + '"');
    console.log("minted : " + a2Amount + " TOKENA to a2");

    await mint(a3Id, a3Amount, token_a_cid);
    balance = await getBalance(a3Id, token_a_cid);
    assert.equal(balance, '"' + a3Amount + '"');
    console.log("minted : " + a3Amount + " TOKENA to a3");

    await mint(b1Id, b1Amount, token_b_cid);
    balance = await getBalance(b1Id, token_b_cid);
    assert.equal(balance, '"' + b1Amount + '"');
    console.log("minted : " + b1Amount + " TOKENB to b1");

    await mint(b2Id, b2Amount, token_b_cid);
    balance = await getBalance(b2Id, token_b_cid);
    assert.equal(balance, '"' + b2Amount + '"');
    console.log("minted : " + b2Amount + " TOKENB to b2");

    await mint(b3Id, b3Amount, token_b_cid);
    balance = await getBalance(b3Id, token_b_cid);
    assert.equal(balance, '"' + b3Amount + '"');
    console.log("minted : " + b3Amount + " TOKENB to b3");

    let result = await pyMultiSwap(multi_swap_cid, atomic_swap_cid, token_a_cid, token_b_cid);
    
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

async function pyMultiSwap(multi_swap_cid, atomic_swap_cid, token_a_cid, token_b_cid) {
    let cmd = 'python3 multi_swap_test.py '  + multi_swap_cid + ' ' + atomic_swap_cid + ' ' + token_a_cid + ' ' + token_b_cid;
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
    const { error, stdout, stderr } = await exec('npm run asbuild:release');
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
        console.log("deployMultiSwapContract - stderr: " + stderr);
    }
    return stdout.trim(); // contract address
}

async function buildTokenContract() {
    const { error, stdout, stderr } = await exec('cd ../token && npm run asbuild:release && cd ../multi_swap');
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
        console.log("deployTokenContract - stderr: " + stderr);
    }
    return stdout.trim(); // contract address
}

async function buildAtomicSwapContract() {
    const { error, stdout, stderr } = await exec('cd ../atomic-swap && npm run asbuild:release && cd ../multi_swap');
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
        console.log("deployAtomicSwapContract - stderr: " + stderr);
    }

    return stdout.trim(); // contract address
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

startTest()