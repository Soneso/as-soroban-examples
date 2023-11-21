const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = "'Test SDF Network ; September 2015'";

const submitterSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57";
const submitterId = "GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T";

const spenderSeed = "SB7CG3VM6G55ORVRKN5VRBW2GEU56JVCCCKNT7Y37QUUWQPISVEMRPXU";
const spenderId = "GCVTOVBTPITNVI5OGVAE4RGM4EM36C3EC2HPUGQWYZHXZ77SEUTC4LLA";

const claimant1_pk = "5055df197382d57271072f4304fdcd755632eeedb20cd5e491c6a48ab383573e";
const claimant1_id = "GBIFLXYZOOBNK4TRA4XUGBH5ZV2VMMXO5WZAZVPESHDKJCVTQNLT526F";
const claimant1_seed = "SB5RHP7IAG6EUVI4XIRZ667KAEUVN5RAEF4LIIIIRUWCJV5C7Y646BOB";

const claimant2_pk = "5ffa71a717c01e879065a1e587c75cb721a7786a54df1612dec344f5ad49a95e";
const claimant2_id = "GBP7U4NHC7AB5B4QMWQ6LB6HLS3SDJ3YNJKN6FQS33BUJ5NNJGUV52FW";
const claimant2_seed = "SCO4KRJELAJVVJH3VFQGQL4JIMESGDY3ZJLKRNHJLBXP5JLFMZULXOOR";

const claimant3_pk = "1b10ab3a8e3083549fbb09aaf4ddd38bc19731beb60f0d6577196314885f4cd6";
const claimant3_id = "GANRBKZ2RYYIGVE7XME2V5G52OF4DFZRX23A6DLFO4MWGFEIL5GNNRVD";
const claimant3_seed = "SCLA2LEFHL56X2HDP5ZIRJRRESVNR4D3BOUERKWBQWAL6G7GZUTVEA7O";

async function startTest() {

    await fundAccounts(); // only needed once after testnet reset

    await buildTimelockContract();

    await pipInstallPythonSDK();

    let timelock_contract_address = await deployTimelockContract();
    let timelock_contract_id = await idForContractAddress(timelock_contract_address);

    let token_contract_address = await prepareTokenContract();
    let token_contract_id = await idForContractAddress(token_contract_address);

    await testDepositAndClaim(timelock_contract_id, token_contract_id, token_contract_address);
    
    timelock_contract_id = await deployTimelockContract();
    await testDoubleDepositNotPossible(timelock_contract_id, token_contract_address);
    
    timelock_contract_id = await deployTimelockContract();
    await testUnauthorizedClaimNotPossible(timelock_contract_id, token_contract_address);

    timelock_contract_id = await deployTimelockContract();
    await testDoubleClaimNotPossible(timelock_contract_id, token_contract_address);

    timelock_contract_id = await deployTimelockContract();
    await testOutOfTimeBoundClaimNotPossible(timelock_contract_id, token_contract_address);
    
    timelock_contract_id = await deployTimelockContract();
    await testDepositAfterClaimNotPossible(timelock_contract_id, token_contract_address);
} 

async function fundAccounts() {
    await fundAccount(submitterId);
    await fundAccount(spenderId);
    await fundAccount(claimant1_id);
    await fundAccount(claimant2_id);
    await fundAccount(claimant3_id);
}

async function prepareTokenContract() {
    await buildTokenContract();
    let token_contract_address = await deployTokenContract();
    let token_contract_id = await idForContractAddress(token_contract_address);
    // create token
    await create_token(token_contract_id);
    // mint
    await mint(spenderId, 10000, token_contract_id);
    let balance = await getBalance(spenderId, token_contract_id);
    assert.equal(balance, '"10000"');
    return token_contract_address;
}

async function buildTimelockContract() {
    const { error, stdout, stderr } = await exec('npm run asbuild:release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function deployTimelockContract() {
    let cmd = 'soroban contract deploy --wasm build/release.wasm ' + 
    '--source ' + submitterSeed + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase;

    console.log(cmd);

    const { error, stdout, stderr } = await exec(cmd);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("DEPLOY TIMELOCK - stderr: " + stderr);
    }
    console.log("timelock contract address: " + stdout.trim());
    return  stdout.trim(); // contract address
}

async function buildTokenContract() {
    const { error, stdout, stderr } = await exec('cd ../token && npm run asbuild:release release && cd ../timelock');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("BUILD TOKEN CONTRACT - stderr: " + stderr);
    }
    console.log(stdout);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function deployTokenContract() {
    const { error, stdout, stderr } = await exec('soroban contract deploy --wasm ../token/build/release.wasm ' + 
    '--source ' + submitterSeed + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("DEPLOY TOKEN - stderr: " + stderr);
    }
    console.log("token contract address: " + stdout.trim());
    return stdout.trim(); // contract address
}

async function testDepositAndClaim(timelock_contract_id, token_contract_id, token_contract_address) {
    console.log(`test deposit and claim ...`);
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 0, now + 5000, timelock_contract_id);
    let balance = await getBalance(spenderId, token_contract_id);
    assert.equal(balance, '"9900"');

    await claim(claimant2_id, claimant2_seed, timelock_contract_id);
    balance = await getBalance(claimant2_id, token_contract_id);
    assert.equal(balance, '"100"');

    balance = await getBalance(claimant1_id, token_contract_id);
    assert.equal(balance, '"0"');

    console.log(`test deposit & claim -> OK`);
}

async function testDoubleDepositNotPossible(timelock_contract_id, token_contract_address) {
    console.log(`test double deposit not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 0, now + 5000, timelock_contract_id);

    now = Math.floor(Date.now() / 1000);
    try {
        let error = await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 0, now + 5000, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #1)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #1)'));
    }

    console.log(`test double deposit not possible -> OK`);
}

async function testUnauthorizedClaimNotPossible(timelock_contract_id, token_contract_address) {
    console.log(`test unauthorized claim not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 0, now + 5000, timelock_contract_id);
    try {
        let error = await claim(claimant3_id, claimant3_seed, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #5)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #5)'));
    }

    console.log(`test unauthorized claim not possible -> OK`);
}

async function testDoubleClaimNotPossible(timelock_contract_id, token_contract_address) {
    console.log(`test double claim not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 0, now + 5000, timelock_contract_id);
    await claim(claimant2_id, claimant2_seed, timelock_contract_id);

    try {
        let error = await claim(claimant2_id, claimant2_seed, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #3)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #3)'));
    }

    console.log(`test double claim not possible -> OK`);
}

async function testOutOfTimeBoundClaimNotPossible(timelock_contract_id, token_contract_address) {
    console.log(`test claim out of timebound not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);

    await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 1, now + 15000, timelock_contract_id);
    try {
        await claim(claimant2_id, claimant2_seed, timelock_contract_id);
        let error = await claim(claimant2_id, claimant2_seed, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #4)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #4)'));
    }

    console.log(`test claim out of timebound not possible -> OK`);
}

async function testDepositAfterClaimNotPossible(timelock_contract_id, token_contract_address) {
    console.log(`test deposit after claim not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 0, now + 5000, timelock_contract_id);
    await claim(claimant2_id, claimant2_seed, timelock_contract_id);

    now = Math.floor(Date.now() / 1000);
    try {
        let error = await deposit(spenderId, spenderSeed, token_contract_address, 100, [claimant1_pk, claimant2_pk], 0, now + 5000, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #1)'));    
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #1)'));
    }
    
    console.log(`test deposit after claim not possiblee -> OK`);
}

async function deposit(from, from_seed, token, amount, claimants, lock_kind, timestamp, timelock_contract_id) {
    let cmd = 'soroban -q contract invoke --source ' + from_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + timelock_contract_id + ' --fee 1000000 -- deposit --from ' + from +' --token ' + token + ' --amount ' + amount  +
    ' --lock_kind ' + lock_kind + ' --timestamp ' + timestamp +
    ' --claimants \'{ "vec": [';
    let i = 0;
    while (i < claimants.length) {
        cmd += '{"address":{"account": {"public_key_type_ed25519":"' + claimants[i] + '"}}}';
        if (i != claimants.length -1) {
            cmd += ', ' 
        }
        i++;
    }
    cmd += "] } '";

    console.log(cmd);
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
        return error;
    }
    if (stderr) {
        console.log("DEPOSIT - stderr: " + stderr);
        return stderr;
    }
    return stdout.trim();
}

async function claim(claimant_id, claimant_seed, timelock_contract_id) {
    let cmd = 'soroban -q contract invoke ' + 
    '--source ' + claimant_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + timelock_contract_id + ' -- claim --claimant ' + claimant_id;
    console.log(cmd);
    const { error, stdout, stderr } = await exec(cmd);

    if (error) {
        console.log(error);
        return error;

    }
    if (stderr) {
        console.log("CLAIM - stderr: " + stderr);
        return stderr;
    }
    return stdout.trim();
}

async function getBalance(user, token_contract_id) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke ' +
    '--source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + token_contract_id + ' -- balance --id ' + user);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("GET BALANCE - stderr: " + stderr);
    }
    return stdout.trim(); // balance
}

async function fundAccount(account_id) {
    const { error, stdout, stderr } = await exec('curl https://friendbot.stellar.org?addr=' + account_id);
}

async function create_token(token_contract_id) {
    let cmd = 'soroban -q contract invoke --source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id 
    + ' -- initialize --admin ' + submitterId 
    + ' --decimal 8 --name 536f6e65736f --symbol 534f4e';

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("CREATE_TOKEN - stderr: " + stderr);
    }
    return stdout.trim();
}

async function mint(to, amount, token_contract_id) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke' + 
    ' --source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id + ' -- mint --to ' + to + ' --amount ' + amount);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("MINT - stderr: " + stderr);
    }
    return stdout.trim();
}

async function pipInstallPythonSDK() {
    let pip = 'pip3 install git+https://github.com/StellarCN/py-stellar-base.git'; // 'pip3 install -U stellar-sdk'
    const { error, stdout, stderr } = await exec(pip);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("pip3 install - stderr:"  + stderr);
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