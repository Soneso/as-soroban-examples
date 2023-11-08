const util = require('util');
const exec = util.promisify(require('child_process').exec);
var assert = require('assert');

const ALREADY_INITIALIZED_ERR_CODE = 1;
const DECIMAL_MUST_FIT_IN_U8_ERR_CODE = 2;
const INSUFFICIENT_ALLOWANCE_ERR_CODE = 3;
const INSUFFICIENT_BALANCE_ERR_CODE = 5;

async function startTest() {

    await clean();
    await buildContract();
    await testContract();
    await clean();
    await testBurn();
    await clean();
    await testInsufficientBalance();
    await clean();
    await testInsufficientAllowance();
    await clean();
    await testAlreadyInitialized();
    await clean();
    await testDecimalOverMax();
} 

async function clean() {
    const { error, stdout, stderr } = await exec('rm -rf .soroban');
    console.log(stdout);
}

async function buildContract() {
    const { error, stdout, stderr } = await exec('asc assembly/contract.ts --target release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function testContract() {
    console.log(`test token contract ...`);
    
    let admin1_name = "admin1";
    let admin2_name = "admin2";
    let user1_name = "user1";
    let user2_name = "user2";
    let user3_name = "user3";

    let admin1_id = await generateIdentity(admin1_name);
    let admin2_id = await generateIdentity(admin2_name);
    let user1_id = await generateIdentity(user1_name);
    let user2_id = await generateIdentity(user2_name);
    let user3_id = await generateIdentity(user3_name);

    // create token
    await create_token(admin1_id);
    
    // mint
    await mint(admin1_name, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');
    
    // approve allowance
    await approve(user2_name, user2_id, user3_id, 500, 200);
    let allowance = await getAllowance(user2_id, user3_id);
    assert.equal(allowance, '"500"');
    
    // transfer
    await transfer(user1_name, user1_id, user2_id, 600);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"400"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"600"');
    
    // transfer from
    await transfer_from(user3_name, user3_id, user2_id, user1_id, 400);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"800"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"200"');
    
    // transfer
    await transfer(user1_name, user1_id, user3_id, 300);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"500"');
    balance = await getBalance(user3_id);
    assert.equal(balance, '"300"');
    
    // set admin
    await set_admin(admin1_name, admin2_id);
    
    // increase allowance to 500
    await approve(user2_name, user2_id, user3_id, 500, 200);
    allowance = await getAllowance(user2_id, user3_id);
    assert.equal(allowance, '"500"');

    await approve(user2_name, user2_id, user3_id, 0, 200);
    allowance = await getAllowance(user2_id, user3_id);
    assert.equal(allowance, '"0"');

    console.log(`test contract -> OK`);
}

async function testBurn() {
    console.log(`test burn ...`);

    let admin_name = "admin";;
    let user1_name = "user1";
    let user2_name = "user2";

    let admin_id = await generateIdentity(admin_name);
    let user1_id = await generateIdentity(user1_name);
    let user2_id = await generateIdentity(user2_name);

    // create token
    await create_token(admin_id);
    
    // mint
    await mint(admin_name, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    // increase allowance
    await approve(user1_name, user1_id, user2_id, 500, 200);
    let allowance = await getAllowance(user1_id, user2_id);
    assert.equal(allowance, '"500"');

    // burn from
    await burn_from(user2_name, user2_id, user1_id, 500);
    allowance = await getAllowance(user1_id, user2_id);
    assert.equal(allowance, '"0"');
    balance = await getBalance(user1_id);
    assert.equal(balance, '"500"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"0"');

    // burn 
    await burn(user1_name, user1_id, 500);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"0"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"0"');
    console.log(`test burn -> OK`);
}

async function testInsufficientBalance() {
    console.log(`test insufficient balance ...`);

    let admin_name = "admin";;
    let user1_name = "user1";
    let user2_name = "user2";

    let admin_id = await generateIdentity(admin_name);
    let user1_id = await generateIdentity(user1_name);
    let user2_id = await generateIdentity(user2_name);

    // create token
    await create_token(admin_id);
    
    // mint
    await mint(admin_name, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    // transfer
    await transfer_err(user1_name, user1_id, user2_id, 1001, INSUFFICIENT_BALANCE_ERR_CODE);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"0"');

    console.log(`test insufficient balance -> OK`);
}

async function testInsufficientAllowance() {
    console.log(`test insufficient allowance ...`);

    let admin_name = "admin";;
    let user1_name = "user1";
    let user2_name = "user2";
    let user3_name = "user3";

    let admin_id = await generateIdentity(admin_name);
    let user1_id = await generateIdentity(user1_name);
    let user2_id = await generateIdentity(user2_name);
    let user3_id = await generateIdentity(user3_name);

    // create token
    await create_token(admin_id);
    
    // mint
    await mint(admin_name, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    await approve(user1_name, user1_id, user3_id, 100, 200);
    let allowance = await getAllowance(user1_id, user3_id);
    assert.equal(allowance, '"100"');

    // transfer
    await transfer_from_err(user3_name, user3_id, user1_id, user2_id, 101, INSUFFICIENT_ALLOWANCE_ERR_CODE);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"0"');
    console.log(`test insufficient allowance -> OK`);
}

async function testAlreadyInitialized() {
    console.log(`test already initialized ...`);

    let admin = await generateIdentity("admin");

    // create token
    await create_token(admin);
    // create again and check err
    await create_token_err(admin, 8, ALREADY_INITIALIZED_ERR_CODE);
    
    console.log(`test already initialized -> OK`);
}

async function testDecimalOverMax() {
    console.log(`test decimal over max ...`);

    let admin = await generateIdentity("admin");

    // create token and check err
    await create_token_err(admin, 277, DECIMAL_MUST_FIT_IN_U8_ERR_CODE);
    
    console.log(`test decimal over max -> OK`);
}

async function generateIdentity(name) {
    const { error, stdout, stderr } = await exec('soroban config identity generate ' 
    + name + ' && soroban config identity address ' + name);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function create_token(admin_id) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --id 1 ' 
    + '--wasm build/release.wasm -- initialize --admin ' + admin_id 
    + ' --decimal 8 --name 536f6e65736f --symbol 534f4e');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("CREATE_TOKEN -stderr: " + stderr);
    }
    if (stdout) {
        console.log("CREATE_TOKEN -stdout: " + stdout);
    }
}

async function create_token_err(admin, decimal, err_code) {
    try {
        const { error, stdout, stderr } = await exec('soroban contract invoke --id 1 ' 
        + '--wasm build/release.wasm -- initialize --admin ' + admin 
        + ' --decimal '+ decimal + ' --name 536f6e65736f --symbol 534f4e');
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
    } catch (error) {
        assert(error.message.includes('HostError: Error(Contract, #' + err_code + ')'));
    }
}

async function mint(admin_name, to, amount) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --source ' + admin_name +
    ' --id 1 --wasm build/release.wasm -- mint ' +
    '--to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("MINT -stderr: " + stderr);
    }
    if (stdout) {
        console.log("MINT -stdout: " + stdout);
    }
}

async function getBalance(user) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke ' +
    ' --id 1 --wasm build/release.wasm -- balance ' +
    '--id ' + user);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("GET_BALANCE -stderr: " + stderr);
    }

    if (stdout) {
        console.log("GET_BALANCE -stdout: " + stdout);
    }  
    return stdout.trim();
}

async function approve(from_name, from_id, spender, amount, expirationLedger) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- approve ' +
    '--from ' + from_id +' --spender ' + spender + ' --amount ' + amount + ' --expiration_ledger ' + expirationLedger);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("APPROVE -stderr: " + stderr);
    }
    if (stdout) {
        console.log("APPROVE -stdout: " + stdout);
    }
}

async function getAllowance(from, spender) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke ' +
    ' --id 1 --wasm build/release.wasm -- allowance ' +
    '--from ' + from + ' --spender ' + spender);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("ALLOWANCE -stderr: " + stderr);
    }
    if (stdout) {
        console.log("ALLOWANCE -stdout: " + stdout);
    }
    return stdout.trim();
}

async function transfer(from_name, from_id, to, amount) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- transfer ' +
    '--from ' + from_id +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("TRANSFER -stderr: " + stderr);
    }
    if (stdout) {
        console.log("TRANSFER -stdout: " + stdout);
    }
}

async function transfer_err(from_name, from_id, to, amount, err_code) {
    try {
        const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + from_name +
        ' --id 1 --wasm build/release.wasm -- transfer ' +
        '--from ' + from_id +' --to ' + to + ' --amount ' + amount);
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
        if (stderr) {
            console.log("TRANSFER_ERR -stderr: " + stderr);
        }
        if (stdout) {
            console.log("TRANSFER_ERR -stdout: " + stdout);
        }
    } catch (error) {
        assert(error.message.includes('HostError: Error(Contract, #' + err_code + ')'));
        console.log(`OK`);
    }
}

async function transfer_from(spender_name, spender_id, from, to, amount) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --source ' + spender_name +
    ' --id 1 --wasm build/release.wasm -- transfer_from ' +
    '--spender ' + spender_id + ' --from ' + from +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("TRANSFER_FROM -stderr: " + stderr);
    }
    if (stdout) {
        console.log("TRANSFER_FROM -stdout: " + stdout);
    }
}

async function transfer_from_err(spender_name, spender_id, from, to, amount, err_code) {
    try {
        const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + spender_name +
        ' --id 1 --wasm build/release.wasm -- transfer_from ' +
        '--spender ' + spender_id + ' --from ' + from +' --to ' + to + ' --amount ' + amount);
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
    } catch (error) {
        assert(error.message.includes('HostError: Error(Contract, #' + err_code + ')'));
        console.log(`OK`);
    }
}

async function set_admin(admin_name, newAdmin) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --source ' + admin_name +
    ' --id 1 --wasm build/release.wasm -- set_admin ' +
    '--new_admin ' + newAdmin);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("SET_ADMIN -stderr: " + stderr);
    }
    if (stdout) {
        console.log("SET_ADMIN -stdout: " + stdout);
    }
}

async function burn_from(spender_name, spender_id, from, amount) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --source ' + spender_name +
    ' --id 1 --wasm build/release.wasm -- burn_from ' +
    '--spender ' + spender_id +' --from ' + from + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("BURN_FROM -stderr: " + stderr);
    }
    if (stdout) {
        console.log("BURN_FROM -stdout: " + stdout);
    }
}

async function burn(from_name, from_id, amount) {
    const { error, stdout, stderr } = await exec('soroban -q contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- burn ' +
    '--from ' + from_id + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("BURN -stderr: " + stderr);
    }
    if (stdout) {
        console.log("BURN -stdout: " + stdout);
    }
}

startTest()