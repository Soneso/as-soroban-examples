const util = require('util');
const exec = util.promisify(require('child_process').exec);
var assert = require('assert');

const rpcUrl = 'https://horizon-futurenet.stellar.cash:443/soroban/rpc';
const networkPassphrase = "'Test SDF Future Network ; October 2022'";

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

    //await fundAccounts(); // only needed once after futurenet reset

    await buildTimelockContract();

    let timelock_contract_id = await deployTimelockContract();
    let token_contract_id = await prepareTokenContract();

    await testDepositAndClaim(timelock_contract_id, token_contract_id);
    
    timelock_contract_id = await deployTimelockContract();
    await testDoubleDepositNotPossible(timelock_contract_id, token_contract_id);
    
    timelock_contract_id = await deployTimelockContract();
    await testUnauthorizedClaimNotPossible(timelock_contract_id, token_contract_id);

    timelock_contract_id = await deployTimelockContract();
    await testDoubleClaimNotPossible(timelock_contract_id, token_contract_id);

    timelock_contract_id = await deployTimelockContract();
    await testOutOfTimeBoundClaimNotPossible(timelock_contract_id, token_contract_id);
    
    timelock_contract_id = await deployTimelockContract();
    await testDepositAfterClaimNotPossible(timelock_contract_id, token_contract_id);
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
    let token_contract_id = await deployTokenContract();
    // create token
    await create_token(token_contract_id);
    // mint
    await mint(spenderId, 10000, token_contract_id);
    let balance = await getBalance(spenderId, token_contract_id);
    assert.equal(balance, '"10000"');
    return token_contract_id;
}

async function buildTimelockContract() {
    const { error, stdout, stderr } = await exec('asc assembly/index.ts --target release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function deployTimelockContract() {
    const { error, stdout, stderr } = await exec('soroban contract deploy --wasm build/release.wasm ' + 
    '--source ' + submitterSeed + 
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
    console.log("timelock contract id: " + stdout);
    return stdout.trim(); // contract id
}

async function buildTokenContract() {
    const { error, stdout, stderr } = await exec('cd ../token && asc assembly/index.ts --target release && cd ../timelock');
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
    '--source ' + submitterSeed + 
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
    console.log("token contract id: " + stdout);
    return stdout.trim(); // contract id
}

async function testDepositAndClaim(timelock_contract_id, token_contract_id) {
    console.log(`test deposit and claim ...`);
    
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 0, Date.now() + 5000, timelock_contract_id);
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
    
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 0, Date.now() + 5000, timelock_contract_id);

    let error = await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 0, Date.now() + 5000, timelock_contract_id);
    assert.equal(true, error.includes('Status(ContractError(1))'));

    console.log(`test double deposit not possible -> OK`);
}

async function testUnauthorizedClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test unauthorized claim not possible ...`);
    
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 0, Date.now() + 5000, timelock_contract_id);

    let error = await claim(claimant3_id, claimant3_seed, timelock_contract_id);
    assert.equal(true, error.includes('Status(ContractError(5))'));
    console.log(`test unauthorized claim not possible -> OK`);
}

async function testDoubleClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test double claim not possible ...`);
    
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 0, Date.now() + 5000, timelock_contract_id);
    await claim(claimant2_id, claimant2_seed, timelock_contract_id);

    let error = await claim(claimant2_id, claimant2_seed, timelock_contract_id);
    console.log(error);
    assert.equal(true, error.includes('Status(ContractError(3))'));
    console.log(`test double claim not possible -> OK`);
}

async function testOutOfTimeBoundClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test claim out of timebound not possible ...`);
    
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 1, Date.now() + 15000, timelock_contract_id);
    await claim(claimant2_id, claimant2_seed, timelock_contract_id);

    let error = await claim(claimant2_id, claimant2_seed, timelock_contract_id);
    console.log(error);
    assert.equal(true, error.includes('Status(ContractError(4))'));
    console.log(`test claim out of timebound not possible -> OK`);
}

async function testDepositAfterClaimNotPossible(timelock_contract_id, token_contract_id) {
    console.log(`test deposit after claim not possible ...`);
    
    await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 0, Date.now() + 5000, timelock_contract_id);
    await claim(claimant2_id, claimant2_seed, timelock_contract_id);

    let error = await deposit(spenderId, spenderSeed, token_contract_id, 100, [claimant1_pk, claimant2_pk], 0, Date.now() + 5000, timelock_contract_id);
    assert.equal(true, error.includes('Status(ContractError(1))'));

    console.log(`test deposit after claim not possiblee -> OK`);
}

async function deposit(from, from_seed, token, amount, claimants, lock_kind, timestamp, timelock_contract_id) {
    let cmd = 'soroban contract invoke --source ' + from_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + timelock_contract_id + ' -- deposit --from ' + from +' --token ' + token + ' --amount ' + amount  +
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

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        return error;
    }
    if (stderr) {
        return stderr;
    }
    return stdout.trim();
}

async function claim(claimant_id, claimant_seed, timelock_contract_id) {
    let cmd = 'soroban contract invoke ' + 
    '--source ' + claimant_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + timelock_contract_id + ' -- claim --claimant ' + claimant_id;
    console.log(cmd);
    const { error, stdout, stderr } = await exec(cmd);

    if (error) {
        return error;
    }
    if (stderr) {
        return stderr;
    }
    return stdout.trim();
}

async function getBalance(user, token_contract_id) {
    const { error, stdout, stderr } = await exec('soroban contract invoke ' +
    '--source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + token_contract_id + ' -- balance --id ' + user);

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

async function fundAccount(account_id) {
    const { error, stdout, stderr } = await exec('curl https://friendbot-futurenet.stellar.org?addr=' + account_id);
}

async function create_token(token_contract_id) {
    let cmd = 'soroban contract invoke --source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id 
    + ' -- initialize --admin ' + submitterId 
    + ' --decimal 8 --name 536f6e65736f --symbol 534f4e';

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
    ' --source ' + submitterSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id + ' -- mint --admin ' + submitterId +' --to ' + to + ' --amount ' + amount);

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

startTest()