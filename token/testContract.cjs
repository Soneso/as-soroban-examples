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
    await mint(admin1_name, admin1_id, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');
    
    // incr allow
    await incr_allow(user2_name, user2_id, user3_id, 500);
    let allowance = await getAllowance(user2_id, user3_id);
    assert.equal(allowance, '"500"');
    
    // xfer
    await xfer(user1_name, user1_id, user2_id, 600);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"400"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"600"');
    
    // xfer from
    await xfer_from(user3_name, user3_id, user2_id, user1_id, 400);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"800"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"200"');
    
    // xfer
    await xfer(user1_name, user1_id, user3_id, 300);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"500"');
    balance = await getBalance(user3_id);
    assert.equal(balance, '"300"');
    
    // set admin
    await set_admin(admin1_name, admin1_id, admin2_id);
    
    // set auth
    await set_auth(admin2_name, admin2_id, user2_id, 0); // TODO fix to work with bool also
    let authorized = await getAuthorized(user2_id);
    assert.equal(authorized, 'false');
    
    // clawback
    await clawback(admin2_name, admin2_id, user3_id, 100);
    balance = await getBalance(user3_id);
    assert.equal(balance, '"200"');
    
    // incr allow
    // Increase by 400, with an existing 100 = 500
    await incr_allow(user2_name, user2_id, user3_id, 400);
    allowance = await getAllowance(user2_id, user3_id);
    assert.equal(allowance, '"500"');
    
    await decr_allow_err(user2_name, user2_id, user3_id, 501); 
    allowance = await getAllowance(user2_id, user3_id);
    assert.equal(allowance, '"500"');
    
    await decr_allow(user2_name, user2_id, user3_id, 500); 
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
    await mint(admin_name, admin_id , user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    // incr allow
    await incr_allow(user1_name, user1_id, user2_id, 500);
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
    await mint(admin_name, admin_id, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    // xfer
    await xfer_err(user1_name, user1_id, user2_id, 1001, 8);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"0"');

    console.log(`test insufficient balance -> OK`);
}

async function testReceiveDeauthorized() {
    console.log(`test receive deauthorized ...`);

    let admin_name = "admin";;
    let user1_name = "user1";
    let user2_name = "user2";

    let admin_id = await generateIdentity(admin_name);
    let user1_id = await generateIdentity(user1_name);
    let user2_id = await generateIdentity(user2_name);

    // create token
    await create_token(admin_id);
    
    // mint
    await mint(admin_name, admin_id, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    await set_auth(admin_name, admin_id, user2_id, 0);

    // xfer
    await xfer_err(user1_name, user1_id, user2_id, 1000, 6);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"0"');
    console.log(`test receive deauthorized -> OK`);
}

async function testSpendDeauthorized() {
    console.log(`test spend deauthorized ...`);

    let admin_name = "admin";;
    let user1_name = "user1";
    let user2_name = "user2";

    let admin_id = await generateIdentity(admin_name);
    let user1_id = await generateIdentity(user1_name);
    let user2_id = await generateIdentity(user2_name);

    // create token
    await create_token(admin_id);
    
    // mint
    await mint(admin_name, admin_id, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    await set_auth(admin_name, admin_id, user1_id, 0);

    // xfer
    await xfer_err(user1_name, user1_id, user2_id, 1000, 7);
    balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');
    balance = await getBalance(user2_id);
    assert.equal(balance, '"0"');
    console.log(`test spend deauthorized -> OK`);
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
    await mint(admin_name, admin_id, user1_id, 1000);
    let balance = await getBalance(user1_id);
    assert.equal(balance, '"1000"');

    await incr_allow(user1_name, user1_id, user3_id, 100);
    let allowance = await getAllowance(user1_id, user3_id);
    assert.equal(allowance, '"100"');

    // xfer
    await xfer_from_err(user3_name, user3_id, user1_id, user2_id, 101, 4);
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

async function create_token(admin_id) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --id 1 ' 
    + '--wasm build/release.wasm -- initialize --admin ' + admin_id 
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
    + '--wasm build/release.wasm -- initialize --admin ' + admin 
    + ' --decimal '+ decimal + ' --name 536f6e65736f --symbol 534f4e');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError(' + err_code + '))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "Debug VM trapped with host error"\n' +
    `   1: "Debug escalating error '' to VM trap"\n` +
    `   2: "Debug failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban_cli::commands::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban_cli::commands::contract::Cmd::run::{{closure}}\n' +
    '   8: soroban_cli::commands::Root::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function mint(admin_name, admin_id, to, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + admin_name +
    ' --id 1 --wasm build/release.wasm -- mint ' +
    '--admin ' + admin_id +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function getBalance(user) {
    const { error, stdout, stderr } = await exec('soroban contract invoke ' +
    ' --id 1 --wasm build/release.wasm -- balance ' +
    '--id ' + user);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function incr_allow(from_name, from_id, spender, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- incr_allow ' +
    '--from ' + from_id +' --spender ' + spender + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function decr_allow_err(from_name, from_id, spender, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- decr_allow ' +
    '--from ' + from_id +' --spender ' + spender + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError(4))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "Debug VM trapped with host error"\n' +
    `   1: "Debug escalating error '' to VM trap"\n` +
    `   2: "Debug failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban_cli::commands::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban_cli::commands::contract::Cmd::run::{{closure}}\n' +
    '   8: soroban_cli::commands::Root::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function decr_allow(from_name, from_id, spender, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- decr_allow ' +
    '--from ' + from_id +' --spender ' + spender + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function getAllowance(from, spender) {
    const { error, stdout, stderr } = await exec('soroban contract invoke ' +
    ' --id 1 --wasm build/release.wasm -- allowance ' +
    '--from ' + from + ' --spender ' + spender);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function xfer(from_name, from_id, to, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- xfer ' +
    '--from ' + from_id +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function xfer_err(from_name, from_id, to, amount, err_code) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- xfer ' +
    '--from ' + from_id +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError('+err_code+'))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "Debug VM trapped with host error"\n' +
    `   1: "Debug escalating error '' to VM trap"\n` +
    `   2: "Debug failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban_cli::commands::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban_cli::commands::contract::Cmd::run::{{closure}}\n' +
    '   8: soroban_cli::commands::Root::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function xfer_from(spender_name, spender_id, from, to, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + spender_name +
    ' --id 1 --wasm build/release.wasm -- xfer_from ' +
    '--spender ' + spender_id + ' --from ' + from +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function xfer_from_err(spender_name, spender_id, from, to, amount, err_code) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + spender_name +
    ' --id 1 --wasm build/release.wasm -- xfer_from ' +
    '--spender ' + spender_id + ' --from ' + from +' --to ' + to + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    let res = 'error: HostError\n' +
    'Value: Status(ContractError(' + err_code + '))\n' +
    '\n' +
    'Debug events (newest first):\n' +
    '   0: "Debug VM trapped with host error"\n' +
    `   1: "Debug escalating error '' to VM trap"\n` +
    `   2: "Debug failing with contract error status code ''"\n` +
    '\n' +
    'Backtrace (newest first):\n' +
    '   0: backtrace::capture::Backtrace::new_unresolved\n' +
    '   1: soroban_env_host::host::err_helper::<impl soroban_env_host::host::Host>::err\n' +
    '   2: soroban_env_host::host::Host::with_frame\n' +
    '   3: soroban_env_host::vm::Vm::invoke_function_raw\n' +
    '   4: soroban_env_host::host::Host::call_n_internal\n' +
    '   5: soroban_env_host::host::Host::invoke_function\n' +
    '   6: soroban_cli::commands::contract::invoke::Cmd::run_in_sandbox\n' +
    '   7: soroban_cli::commands::contract::Cmd::run::{{closure}}\n' +
    '   8: soroban_cli::commands::Root::run::{{closure}}\n' +
    '   9: tokio::runtime::park::CachedParkThread::block_on\n' +
    '  10: tokio::runtime::scheduler::multi_thread::MultiThread::block_on\n' +
    '  11: soroban::main';
    assert.equal(stderr.trim(), res);
}

async function set_admin(admin_name, admin_id, newAdmin) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + admin_name +
    ' --id 1 --wasm build/release.wasm -- set_admin ' +
    '--admin ' + admin_id +' --new_admin ' + newAdmin);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function set_auth(admin_name, admin_id, id, authorize) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + admin_name +
    ' --id 1 --wasm build/release.wasm -- set_auth ' +
    '--admin ' + admin_id +' --id ' + id + ' --authorize ' + authorize );
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function getAuthorized(user) {
    const { error, stdout, stderr } = await exec('soroban contract invoke ' +
    ' --id 1 --wasm build/release.wasm -- authorized ' +
    '--id ' + user);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function clawback(admin_name, admin_id, from, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + admin_name +
    ' --id 1 --wasm build/release.wasm -- clawback ' +
    '--admin ' + admin_id + ' --from ' + from + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function burn_from(spender_name, spender_id, from, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + spender_name +
    ' --id 1 --wasm build/release.wasm -- burn_from ' +
    '--spender ' + spender_id +' --from ' + from + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}

async function burn(from_name, from_id, amount) {
    const { error, stdout, stderr } = await exec('soroban contract invoke --source ' + from_name +
    ' --id 1 --wasm build/release.wasm -- burn ' +
    '--from ' + from_id + ' --amount ' + amount);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    console.log(stderr);
}



startTest()