const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = "'Test SDF Network ; September 2015'";
const friendbotUrl = 'https://friendbot.stellar.org?addr=';

//const rpcUrl = 'https://rpc-futurenet.stellar.org';
//const networkPassphrase = "'Test SDF Future Network ; October 2022'";
//const friendbotUrl = 'https://friendbot-futurenet.stellar.org?addr=';

const submitterSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57";
const submitterId = "GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T";

const spenderSeed = "SB7CG3VM6G55ORVRKN5VRBW2GEU56JVCCCKNT7Y37QUUWQPISVEMRPXU";
const spenderId = "GCVTOVBTPITNVI5OGVAE4RGM4EM36C3EC2HPUGQWYZHXZ77SEUTC4LLA";

const claimant1_id = "GBIFLXYZOOBNK4TRA4XUGBH5ZV2VMMXO5WZAZVPESHDKJCVTQNLT526F";
const claimant1_seed = "SB5RHP7IAG6EUVI4XIRZ667KAEUVN5RAEF4LIIIIRUWCJV5C7Y646BOB";

const claimant2_id = "GBP7U4NHC7AB5B4QMWQ6LB6HLS3SDJ3YNJKN6FQS33BUJ5NNJGUV52FW";
const claimant2_seed = "SCO4KRJELAJVVJH3VFQGQL4JIMESGDY3ZJLKRNHJLBXP5JLFMZULXOOR";

const claimant3_id = "GANRBKZ2RYYIGVE7XME2V5G52OF4DFZRX23A6DLFO4MWGFEIL5GNNRVD";
const claimant3_seed = "SCLA2LEFHL56X2HDP5ZIRJRRESVNR4D3BOUERKWBQWAL6G7GZUTVEA7O";

const jsonrpcErr = 'error: jsonrpc error:';
const sleepCmd = 5000;

async function startTest() {

    //await fundAccounts(); // only needed once after testnet reset

    await buildTimelockContract();

    let timelock_contract_id = await deployContract('build/release.wasm');
    console.log("timelock contract id: " + timelock_contract_id);

    console.log("preparing token ...");
    let token_contract_id = await prepareToken();
    console.log("token prepared");

    await testDepositAndClaim(timelock_contract_id, token_contract_id);
    
    timelock_contract_id = await deployContract('build/release.wasm');
    console.log("timelock contract id: " + timelock_contract_id);
    await testDoubleDepositNotPossible(timelock_contract_id, token_contract_id);
    
    timelock_contract_id = await deployContract('build/release.wasm');
    console.log("timelock contract id: " + timelock_contract_id);
    await testUnauthorizedClaimNotPossible(timelock_contract_id, token_contract_id);

    timelock_contract_id = await deployContract('build/release.wasm');
    console.log("timelock contract id: " + timelock_contract_id);
    await testDoubleClaimNotPossible(timelock_contract_id, token_contract_id);

    timelock_contract_id = await deployContract('build/release.wasm');
    console.log("timelock contract id: " + timelock_contract_id);
    await testOutOfTimeBoundClaimNotPossible(timelock_contract_id, token_contract_id);
    
    timelock_contract_id = await deployContract('build/release.wasm');
    console.log("timelock contract id: " + timelock_contract_id);
    await testDepositAfterClaimNotPossible(timelock_contract_id, token_contract_id);

    console.log('timelock test done -> OK');
} 

async function fundAccounts() {
    console.log('funding accounts ...');
    await fundAccount(submitterId);
    await fundAccount(spenderId);
    await fundAccount(claimant1_id);
    await fundAccount(claimant2_id);
    await fundAccount(claimant3_id);
    console.log('done funding accounts');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function prepareToken() {
    
    try {
        await buildTokenContract();
        let token_contract_id = await deployContract('../token/build/release.wasm');
        // create token
        await create_token(token_contract_id);
        // mint
        await mint(spenderId, 10000, token_contract_id);
        let balance = await getBalance(spenderId, token_contract_id);
        assert.equal(balance, '"10000"');
        return token_contract_id;
    } catch(error) {
        if (error.message.includes(jsonrpcErr)) {
            console.log(`Catched err ` + error);
            console.log("retrying after 5 seconds")
            await sleep(5000); 
            return await prepareToken();
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
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

async function deployContract(path) {
    try {
        console.log("deploy contract " + path +  " ...")
        let cmd = 'soroban contract deploy'
        + ' --wasm ' + path + 
        ' --source ' + submitterSeed + 
        ' --rpc-url ' + rpcUrl +
        ' --network-passphrase ' + networkPassphrase;
    
        const { error, stdout, stderr } = await exec(cmd);
        if (error) {
            console.log(error);
        }
        if (stderr) {
            console.log("deploy contract - stderr: " + stderr);
        }
        sleep(sleepCmd);
        return stdout.trim(); // contract id
    } catch(error) {
        if (error.message.includes(jsonrpcErr)) {
            console.log(`Catched err ` + error);
            console.log("retrying after 5 seconds")
            await sleep(5000); 
            return await deployContract(path);
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
}

async function buildTokenContract() {
    const { error, stdout, stderr } = await exec('cd ../token && npm run asbuild:release && cd ../timelock');
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

async function testDepositAndClaim(timelock_contract_id, token_contract_id) {
    console.log(`test deposit and claim ...`);
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 0, now + 5000, timelock_contract_id);
    let balance = await getBalance(spenderId, token_contract_id);
    assert.equal(balance, '"9900"');

    await claim(claimant2_id, claimant2_seed, timelock_contract_id);
    balance = await getBalance(claimant2_id, token_contract_id);
    assert.equal(balance, '"100"');

    balance = await getBalance(claimant1_id, token_contract_id);
    assert.equal(balance, '"0"');

    console.log(`test deposit & claim -> OK`);
}

async function testDoubleDepositNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test double deposit not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 0, now + 5000, timelock_contract_id);

    now = Math.floor(Date.now() / 1000);
    try {
        let error = await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 0, now + 5000, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #1)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #1)'));
    }

    console.log(`test double deposit not possible -> OK`);
}

async function testUnauthorizedClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test unauthorized claim not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 0, now + 5000, timelock_contract_id);
    try {
        let error = await claim(claimant3_id, claimant3_seed, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #5)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #5)'));
    }

    console.log(`test unauthorized claim not possible -> OK`);
}

async function testDoubleClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test double claim not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 0, now + 5000, timelock_contract_id);
    await claim(claimant2_id, claimant2_seed, timelock_contract_id);

    try {
        let error = await claim(claimant2_id, claimant2_seed, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #3)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #3)'));
    }

    console.log(`test double claim not possible -> OK`);
}

async function testOutOfTimeBoundClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test claim out of timebound not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);

    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 1, now + 15000, timelock_contract_id);
    try {
        await claim(claimant2_id, claimant2_seed, timelock_contract_id);
        let error = await claim(claimant2_id, claimant2_seed, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #4)'));
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #4)'));
    }

    console.log(`test claim out of timebound not possible -> OK`);
}

async function testDepositAfterClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test deposit after claim not possible ...`);
    
    let now = Math.floor(Date.now() / 1000);
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 0, now + 5000, timelock_contract_id);
    await claim(claimant2_id, claimant2_seed, timelock_contract_id);

    now = Math.floor(Date.now() / 1000);
    try {
        let error = await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_id, claimant2_id], 0, now + 5000, timelock_contract_id);
        assert.equal(true, error.includes('HostError: Error(Contract, #1)'));    
    } catch(error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #1)'));
    }
    
    console.log(`test deposit after claim not possible -> OK`);
}

async function deposit(from, from_seed, token_contract_id, amount, claimants, lock_kind, timestamp, timelock_contract_id) {
    let cmd = 'soroban -q contract invoke --source ' + from_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + timelock_contract_id + ' --fee 1000000 -- deposit --from ' + from +' --token ' + token_contract_id + ' --amount ' + amount  +
    ' --lock_kind ' + lock_kind + ' --timestamp ' + timestamp +
    ' --claimants \'{ "vec": [';
    let i = 0;
    while (i < claimants.length) {
        cmd += '{"address":"' + claimants[i] + '"}';
        if (i != claimants.length -1) {
            cmd += ', ' 
        }
        i++;
    }
    cmd += "] } '";

    //console.log(cmd);
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
        return error;
    }
    if (stderr) {
        console.log("DEPOSIT - stderr: " + stderr);
        return stderr;
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function claim(claimant_id, claimant_seed, timelock_contract_id) {
    let cmd = 'soroban -q contract invoke ' + 
    '--source ' + claimant_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + timelock_contract_id + ' -- claim --claimant ' + claimant_id;
    //console.log(cmd);
    const { error, stdout, stderr } = await exec(cmd);

    if (error) {
        console.log(error);
        return error;

    }
    if (stderr) {
        console.log("CLAIM - stderr: " + stderr);
        return stderr;
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function getBalance(user, token_contract_id) {
    console.log("get balance ...");
    const { error, stdout, stderr } = await exec('soroban -q contract invoke ' +
    '--source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + token_contract_id + ' -- balance --id ' + user);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("GET BALANCE - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim(); // balance
}

async function fundAccount(account_id) {
    const { error, stdout, stderr } = await exec('curl '  + friendbotUrl + account_id);
}

async function create_token(token_contract_id) {
    console.log("create token ...");
    let cmd = 'soroban -q contract invoke --source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id 
    + ' -- initialize --admin ' + submitterId 
    + ' --decimal 8 --name "my token" --symbol MTOK';

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("CREATE_TOKEN - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function mint(to, amount, token_contract_id) {
    console.log("mint ...");
    const { error, stdout, stderr } = await exec('soroban -q contract invoke' + 
    ' --source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id + ' -- mint --to ' + to + ' --amount ' + amount);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("MINT - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim();
}

startTest()