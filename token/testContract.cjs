const util = require('util');
const exec = util.promisify(require('child_process').exec);
var assert = require('assert');

async function startTest() {

    await clean();
    await buildContract();
    await testContract();
    await clean();
    await testBurn();
    await clean();
    await testInsufficientBalance();
    await clean();
    await testReceiveDeauthorized();
    await clean();
    await testSpendDeauthorized();
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
    const { error, stdout, stderr } = await exec('asc assembly/index.ts --target release');
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
    
    let admin1 = await generateIdentity("admin1");
    let admin2 = await generateIdentity("admin2");
    let user1 = await generateIdentity("user1");
    let user2 = await generateIdentity("user2");
    let user3 = await generateIdentity("user3");

    // create token
    await create_token(admin1);
    
    // mint
    await mint(admin1, user1, 1000);
    let balance = await getBalance(user1);
    assert.equal(balance, '"1000"');

    // incr allow
    await incr_allow(user2, user3, 500);
    let allowance = await getAllowance(user2, user3);
    assert.equal(allowance, '"500"');

    // xfer
    await xfer(user1, user2, 600);
    balance = await getBalance(user1);
    assert.equal(balance, '"400"');
    balance = await getBalance(user2);
    assert.equal(balance, '"600"');

    // xfer from
    await xfer_from(user3, user2, user1, 400);
    balance = await getBalance(user1);
    assert.equal(balance, '"800"');
    balance = await getBalance(user2);
    assert.equal(balance, '"200"');

    // xfer
    await xfer(user1, user3, 300);
    balance = await getBalance(user1);
    assert.equal(balance, '"500"');
    balance = await getBalance(user3);
    assert.equal(balance, '"300"');

    // set admin
    await set_admin(admin1, admin2);
    
    // set auth
    await set_auth(admin2, user2, 0); // TODO fix to work with bool also
    let authorized = await getAuthorized(user2);
    assert.equal(authorized, 'false');

    // clawback
    await clawback(admin2, user3, 100);
    balance = await getBalance(user3);
    assert.equal(balance, '"200"');

    // incr allow
    // Increase by 400, with an existing 100 = 500
    await incr_allow(user2, user3, 400);
    allowance = await getAllowance(user2, user3);
    assert.equal(allowance, '"500"');

    await decr_allow_err(user2, user3, 501); 
    allowance = await getAllowance(user2, user3);
    assert.equal(allowance, '"500"');

    await decr_allow(user2, user3, 500); 
    allowance = await getAllowance(user2, user3);
    assert.equal(allowance, '"0"');

    console.log(`test contract -> OK`);
}

async function testBurn() {
    console.log(`test burn ...`);

    let admin = await generateIdentity("admin");
    let user1 = await generateIdentity("user1");
    let user2 = await generateIdentity("user2");

    // create token
    await create_token(admin);
    
    // mint
    await mint(admin, user1, 1000);
    let balance = await getBalance(user1);
    assert.equal(balance, '"1000"');

    // incr allow
    await incr_allow(user1, user2, 500);
    let allowance = await getAllowance(user1, user2);
    assert.equal(allowance, '"500"');

    // burn from
    await burn_from(user2, user1, 500);
    allowance = await getAllowance(user1, user2);
    assert.equal(allowance, '"0"');
    balance = await getBalance(user1);
    assert.equal(balance, '"500"');
    balance = await getBalance(user2);
    assert.equal(balance, '"0"');

    // burn 
    await burn(user1, 500);
    balance = await getBalance(user1);
    assert.equal(balance, '"0"');
    balance = await getBalance(user2);
    assert.equal(balance, '"0"');
    console.log(`test burn -> OK`);
}

async function testInsufficientBalance() {
    console.log(`test insufficient balance ...`);

    let admin = await generateIdentity("admin");
    let user1 = await generateIdentity("user1");
    let user2 = await generateIdentity("user2");

    // create token
    await create_token(admin);
    
    // mint
    await mint(admin, user1, 1000);
    let balance = await getBalance(user1);
    assert.equal(balance, '"1000"');

    // xfer
    await xfer_err(user1, user2, 1001, 8);
    balance = await getBalance(user1);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2);
    assert.equal(balance, '"0"');

    console.log(`test insufficient balance -> OK`);
}

async function testReceiveDeauthorized() {
    console.log(`test receive deauthorized ...`);

    let admin = await generateIdentity("admin");
    let user1 = await generateIdentity("user1");
    let user2 = await generateIdentity("user2");

    // create token
    await create_token(admin);
    
    // mint
    await mint(admin, user1, 1000);
    let balance = await getBalance(user1);
    assert.equal(balance, '"1000"');

    await set_auth(admin, user2, 0);

    // xfer
    await xfer_err(user1, user2, 1000, 6);
    balance = await getBalance(user1);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2);
    assert.equal(balance, '"0"');
    console.log(`test receive deauthorized -> OK`);
}

async function testSpendDeauthorized() {
    console.log(`test spend deauthorized ...`);

    let admin = await generateIdentity("admin");
    let user1 = await generateIdentity("user1");
    let user2 = await generateIdentity("user2");

    // create token
    await create_token(admin);
    
    // mint
    await mint(admin, user1, 1000);
    let balance = await getBalance(user1);
    assert.equal(balance, '"1000"');

    await set_auth(admin, user1, 0);

    // xfer
    await xfer_err(user1, user2, 1000, 7);
    balance = await getBalance(user1);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2);
    assert.equal(balance, '"0"');
    console.log(`test spend deauthorized -> OK`);
}

async function testInsufficientAllowance() {
    console.log(`test insufficient allowance ...`);

    let admin = await generateIdentity("admin");
    let user1 = await generateIdentity("user1");
    let user2 = await generateIdentity("user2");
    let user3 = await generateIdentity("user3");

    // create token
    await create_token(admin);
    
    // mint
    await mint(admin, user1, 1000);
    let balance = await getBalance(user1);
    assert.equal(balance, '"1000"');

    await incr_allow(user1, user3, 100);
    let allowance = await getAllowance(user1, user3);
    assert.equal(allowance, '"100"');

    // xfer
    await xfer_from_err(user3, user1, user2, 101, 4);
    balance = await getBalance(user1);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2);
    assert.equal(balance, '"0"');
    console.log(`test insufficient allowance -> OK`);
}

async function testAlreadyInitialized() {
    console.log(`test already initialized ...`);

    let admin = await generateIdentity("admin");

    // create token
    await create_token(admin);
    // create again and check err
    await create_token_err(admin, 8, 2);
    
    console.log(`test already initialized -> OK`);
}

async function testDecimalOverMax() {
    console.log(`test decimal over max ...`);

    let admin = await generateIdentity("admin");

    // create token and check err
    await create_token_err(admin, 277, 3);
    
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

async function create_token(admin) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --id 1 ' 
    + '--wasm build/release.wasm --fn initialize -- --admin ' + admin 
    + ' --decimal 8 --name 536f6e65736f --symbol 534f4e');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function create_token_err(admin, decimal, err_code) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --id 1 ' 
    + '--wasm build/release.wasm --fn initialize -- --admin ' + admin 
    + ' --decimal '+ decimal + ' --name 536f6e65736f --symbol 534f4e');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError(' + err_code + '))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "VM trapped with host error"\n' +
    `   1: "escalating error '' to VM trap"\n` +
    `   2: "failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban::contract::SubCmd::run::{{closure}}\n' +
    '   8: soroban::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: tokio::runtime::runtime::Runtime::block_on\n' +
    '  12: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function mint(admin, to, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + admin +
    ' --id 1 --wasm build/release.wasm --fn mint -- ' +
    '--admin ' + admin +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function getBalance(user) {
    const { error, stdout, stderr } = await exec('soroban contract invoke ' +
    ' --id 1 --wasm build/release.wasm --fn balance -- ' +
    '--id ' + user);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function incr_allow(from, spender, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + from +
    ' --id 1 --wasm build/release.wasm --fn incr_allow -- ' +
    '--from ' + from +' --spender ' + spender + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function decr_allow_err(from, spender, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + from +
    ' --id 1 --wasm build/release.wasm --fn decr_allow -- ' +
    '--from ' + from +' --spender ' + spender + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError(4))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "VM trapped with host error"\n' +
    `   1: "escalating error '' to VM trap"\n` +
    `   2: "failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban::contract::SubCmd::run::{{closure}}\n' +
    '   8: soroban::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: tokio::runtime::runtime::Runtime::block_on\n' +
    '  12: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function decr_allow(from, spender, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + from +
    ' --id 1 --wasm build/release.wasm --fn decr_allow -- ' +
    '--from ' + from +' --spender ' + spender + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function getAllowance(from, spender) {
    const { error, stdout, stderr } = await exec('soroban contract invoke ' +
    ' --id 1 --wasm build/release.wasm --fn allowance -- ' +
    '--from ' + from + ' --spender ' + spender);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function xfer(from, to, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + from +
    ' --id 1 --wasm build/release.wasm --fn xfer -- ' +
    '--from ' + from +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function xfer_err(from, to, amount, err_code) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + from +
    ' --id 1 --wasm build/release.wasm --fn xfer -- ' +
    '--from ' + from +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError(' + err_code + '))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "VM trapped with host error"\n' +
    `   1: "escalating error '' to VM trap"\n` +
    `   2: "failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban::contract::SubCmd::run::{{closure}}\n' +
    '   8: soroban::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: tokio::runtime::runtime::Runtime::block_on\n' +
    '  12: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function xfer_from(spender, from, to, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + spender +
    ' --id 1 --wasm build/release.wasm --fn xfer_from -- ' +
    '--spender ' + spender + ' --from ' + from +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function xfer_from_err(spender, from, to, amount, err_code) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + spender +
    ' --id 1 --wasm build/release.wasm --fn xfer_from -- ' +
    '--spender ' + spender + ' --from ' + from +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError(' + err_code + '))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "VM trapped with host error"\n' +
    `   1: "escalating error '' to VM trap"\n` +
    `   2: "failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban::contract::SubCmd::run::{{closure}}\n' +
    '   8: soroban::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: tokio::runtime::runtime::Runtime::block_on\n' +
    '  12: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function set_admin(admin, newAdmin) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + admin +
    ' --id 1 --wasm build/release.wasm --fn set_admin -- ' +
    '--admin ' + admin +' --new_admin ' + newAdmin);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function set_auth(admin, id, authorize) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + admin +
    ' --id 1 --wasm build/release.wasm --fn set_auth -- ' +
    '--admin ' + admin +' --id ' + id + ' --authorize ' + authorize );
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function getAuthorized(user) {
    const { error, stdout, stderr } = await exec('soroban contract invoke ' +
    ' --id 1 --wasm build/release.wasm --fn authorized -- ' +
    '--id ' + user);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function clawback(admin, from, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + admin +
    ' --id 1 --wasm build/release.wasm --fn clawback -- ' +
    '--admin ' + admin + ' --from ' + from + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function burn_from(spender, from, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + spender +
    ' --id 1 --wasm build/release.wasm --fn burn_from -- ' +
    '--spender ' + spender +' --from ' + from + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function burn(from, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --account ' + from +
    ' --id 1 --wasm build/release.wasm --fn burn -- ' +
    '--from ' + from + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}



startTest()