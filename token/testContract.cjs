const util = require('util');
const exec = util.promisify(require('child_process').exec);
var assert = require('assert');

const rpcUrl = ' --rpc-url https://rpc-futurenet.stellar.org';
const networkPassphrase = ' --network-passphrase "Test SDF Future Network ; October 2022"';
const friendbotUrl = 'https://friendbot-futurenet.stellar.org?addr=';
const cmdDeploy = 'soroban contract deploy' + rpcUrl + networkPassphrase + ' --wasm build/release.wasm';
const cmdInvoke = 'soroban contract invoke' + rpcUrl + networkPassphrase + ' --id ';
const jsonrpcErr = 'error: jsonrpc error:';
const approveLedger = 209832;
const sleepCmd = 5000;

const ALREADY_INITIALIZED_ERR_CODE = 1;
const DECIMAL_MUST_FIT_IN_U8_ERR_CODE = 2;
const INSUFFICIENT_ALLOWANCE_ERR_CODE = 3;
const INSUFFICIENT_BALANCE_ERR_CODE = 5;

async function startTest() {

    await buildContract();
    let contractId = await deployContract(cmdDeploy);
    console.log("Token contract id: " + contractId);
    await testContract(contractId);
    contractId = await deployContract(cmdDeploy);
    await testBurn(contractId);
    contractId = await deployContract(cmdDeploy);
    await testInsufficientBalance(contractId);
    contractId = await deployContract(cmdDeploy);
    await testInsufficientAllowance(contractId);
    contractId = await deployContract(cmdDeploy);
    await testAlreadyInitialized(contractId);
    contractId = await deployContract(cmdDeploy);
    await testDecimalOverMax(contractId);
}

async function buildContract() {
    console.log(`build contract ...`)
    const { error, stdout, stderr } = await exec('npm run asbuild:release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    console.log(stdout);
}

async function deployContract(cmd) {
    console.log('deploy contract ...');
    try {
        const { error, stdout, stderr } = await exec(cmd);
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
        if (stderr) {
            //assert.fail(`stderr: ${stderr}`);
        }
        let cId = stdout.trim();
        return cId;
    } catch(error) {
        if (error.message.includes(jsonrpcErr)) {
            console.log(`Catched err ` + error);
            console.log("retrying after 5 seconds")
            await sleep(5000); 
            return await deployContract(cmd);
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fundAccount(account_id) {
    console.log('fund account ' + account_id + ' ...');
    try {
        let cmd = 'curl ' + friendbotUrl + account_id;
        const { error, stdout, stderr } = await exec(cmd);
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
        if (stderr) {
            //assert.fail(`stderr: ${stderr}`);
        }
    } catch(error) {
        if (error.message.includes(jsonrpcErr)) {
            console.log(`Catched err ` + error);
            console.log("retrying after 5 seconds")
            await sleep(5000); 
            return await fundAccount(account_id);
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
}

async function testContract(contract_id) {
    console.log(`test token contract ...`);
    
    let admin1_name = "admin1";
    let admin2_name = "admin2";
    let user1_name = "user1";
    let user2_name = "user2";
    let user3_name = "user3";

    let admin1_id = await generateIdentity(admin1_name);
    await fundAccount(admin1_id);
    let admin2_id = await generateIdentity(admin2_name);
    await fundAccount(admin2_id);
    let user1_id = await generateIdentity(user1_name);
    await fundAccount(user1_id);
    let user2_id = await generateIdentity(user2_name);
    await fundAccount(user2_id);
    let user3_id = await generateIdentity(user3_name);
    await fundAccount(user3_id);

    // create token
    await create_token(contract_id, admin1_name, admin1_id);
    sleep(sleepCmd);
    // mint
    await mint(contract_id, admin1_name, user1_id, 1000);
    sleep(sleepCmd);
    let balance = await getBalance(contract_id, admin1_name, user1_id);
    assert.equal(balance, '"1000"');
    sleep(sleepCmd);
    // approve allowance
    await approve(contract_id, user2_name, user2_id, user3_id, 500, approveLedger);
    sleep(sleepCmd);
    let allowance = await getAllowance(contract_id, admin1_name, user2_id, user3_id);
    assert.equal(allowance, '"500"');
    sleep(sleepCmd);

    // transfer
    await transfer(contract_id, user1_name, user1_id, user2_id, 600);
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin1_name, user1_id);
    assert.equal(balance, '"400"');
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin1_name, user2_id);
    assert.equal(balance, '"600"');
    sleep(sleepCmd);
    
    // transfer from
    await transfer_from(contract_id, user3_name, user3_id, user2_id, user1_id, 400);
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin1_name, user1_id);
    assert.equal(balance, '"800"');
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin1_name, user2_id);
    assert.equal(balance, '"200"');
    sleep(sleepCmd);
    
    // transfer
    await transfer(contract_id, user1_name, user1_id, user3_id, 300);
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin1_name, user1_id);
    assert.equal(balance, '"500"');
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin1_name, user3_id);
    assert.equal(balance, '"300"');
    sleep(sleepCmd);
    
    // set admin
    await set_admin(contract_id, admin1_name, admin2_id);
    sleep(sleepCmd);
    // increase allowance to 500
    await approve(contract_id, user2_name, user2_id, user3_id, 500, approveLedger);
    sleep(sleepCmd);
    allowance = await getAllowance(contract_id, admin1_name, user2_id, user3_id);
    assert.equal(allowance, '"500"');
    sleep(sleepCmd);

    await approve(contract_id, user2_name, user2_id, user3_id, 0, approveLedger);
    sleep(sleepCmd);
    allowance = await getAllowance(contract_id, admin1_name, user2_id, user3_id);
    assert.equal(allowance, '"0"');
    sleep(sleepCmd);

    console.log(`test contract -> OK`);
}

async function testBurn(contract_id) {
    console.log(`test burn ...`);

    let admin_name = "admin";;
    let user1_name = "user1";
    let user2_name = "user2";

    let admin_id = await generateIdentity(admin_name);
    await fundAccount(admin_id);
    let user1_id = await generateIdentity(user1_name);
    await fundAccount(user1_id);
    let user2_id = await generateIdentity(user2_name);
    await fundAccount(user2_id);

    // create token
    await create_token(contract_id, admin_name, admin_id);
    sleep(sleepCmd);

    // mint
    await mint(contract_id, admin_name, user1_id, 1000);
    sleep(sleepCmd);
    let balance = await getBalance(contract_id, admin_name, user1_id);
    assert.equal(balance, '"1000"');

    // increase allowance
    await approve(contract_id, user1_name, user1_id, user2_id, 500, approveLedger);
    sleep(sleepCmd);
    let allowance = await getAllowance(contract_id, admin_name, user1_id, user2_id);
    assert.equal(allowance, '"500"');
    sleep(sleepCmd);

    // burn from
    await burn_from(contract_id, user2_name, user2_id, user1_id, 500);
    sleep(sleepCmd);
    allowance = await getAllowance(contract_id, admin_name, user1_id, user2_id);
    assert.equal(allowance, '"0"');
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin_name, user1_id);
    assert.equal(balance, '"500"');
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin_name, user2_id);
    assert.equal(balance, '"0"');
    sleep(sleepCmd);

    // burn 
    await burn(contract_id, user1_name, user1_id, 500);
    balance = await getBalance(contract_id, admin_name, user1_id);
    assert.equal(balance, '"0"');
    sleep(sleepCmd);
    balance = await getBalance(contract_id, admin_name, user2_id);
    assert.equal(balance, '"0"');
    console.log(`test burn -> OK`);
}

async function testInsufficientBalance(contract_id) {
    console.log(`test insufficient balance ...`);

    let admin_name = "admin";;
    let user1_name = "user1";
    let user2_name = "user2";

    let admin_id = await generateIdentity(admin_name);
    await fundAccount(admin_id);
    let user1_id = await generateIdentity(user1_name);
    await fundAccount(user1_id);
    let user2_id = await generateIdentity(user2_name);
    await fundAccount(user2_id);

    // create token
    await create_token(contract_id, admin_name, admin_id);
    
    // mint
    await mint(contract_id, admin_name, user1_id, 1000);
    let balance = await getBalance(contract_id, admin_name, user1_id);
    assert.equal(balance, '"1000"');

    // transfer
    await transfer_err(contract_id, user1_name, user1_id, user2_id, 1001, INSUFFICIENT_BALANCE_ERR_CODE);
    balance = await getBalance(contract_id, admin_name, user1_id);
    assert.equal(balance, '"1000"');
    balance = await getBalance(contract_id, admin_name, user2_id);
    assert.equal(balance, '"0"');

    console.log(`test insufficient balance -> OK`);
}

async function testInsufficientAllowance(contract_id) {
    console.log(`test insufficient allowance ...`);

    let admin_name = "admin";
    let user1_name = "user1";
    let user2_name = "user2";
    let user3_name = "user3";

    let admin_id = await generateIdentity(admin_name);
    await fundAccount(admin_id);
    let user1_id = await generateIdentity(user1_name);
    await fundAccount(user1_id);
    let user2_id = await generateIdentity(user2_name);
    await fundAccount(user2_id);
    let user3_id = await generateIdentity(user3_name);
    await fundAccount(user3_id);

    // create token
    await create_token(contract_id, admin_name, admin_id);
    
    // mint
    await mint(contract_id, admin_name, user1_id, 1000);
    let balance = await getBalance(contract_id, admin_name, user1_id);
    assert.equal(balance, '"1000"');

    await approve(contract_id, user1_name, user1_id, user3_id, 100, 209832);
    let allowance = await getAllowance(contract_id, admin_name, user1_id, user3_id);
    assert.equal(allowance, '"100"');

    // transfer
    await transfer_from_err(contract_id, user3_name, user3_id, user1_id, user2_id, 101, INSUFFICIENT_ALLOWANCE_ERR_CODE);
    balance = await getBalance(contract_id, admin_name, user1_id);
    assert.equal(balance, '"1000"');
    balance = await getBalance(contract_id, admin_name, user2_id);
    assert.equal(balance, '"0"');
    console.log(`test insufficient allowance -> OK`);
}

async function testAlreadyInitialized(contract_id) {
    console.log(`test already initialized ...`);
    
    let admin_name = "admin";
    let admin_id = await generateIdentity(admin_name);
    await fundAccount(admin_id);

    // create token
    await create_token(contract_id, admin_name, admin_id);
    // create again and check err
    await create_token_err(contract_id, admin_name, admin_id, 8, ALREADY_INITIALIZED_ERR_CODE);
    
    console.log(`test already initialized -> OK`);
}

async function testDecimalOverMax(contract_id) {
    console.log(`test decimal over max ...`);

    let admin_name = "admin";
    let admin_id = await generateIdentity(admin_name);
    await fundAccount(admin_id);

    // create token and check err
    await create_token_err(contract_id, admin_name, admin_id, 277, DECIMAL_MUST_FIT_IN_U8_ERR_CODE);
    
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

async function create_token(contract_id, invoker, admin_id) {
    console.log('create token ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + invoker +
                ' -- initialize --admin ' + admin_id  +
                ' --decimal 8 --name "best token" --symbol "BTO"';
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("CREATE_TOKEN -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("CREATE_TOKEN -stdout: " + stdout);
    }
}

async function create_token_err(contract_id, invoker, admin_id, decimal, err_code) {
    try {
        let cmd = cmdInvoke + contract_id + ' --source ' + invoker +
                ' -- initialize --admin ' + admin_id  +
                ' --decimal ' + decimal +
                ' --name "best token" --symbol "BTO"';
        const { error, stdout, stderr } = await exec(cmd);
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
    } catch (error) {
        assert(error.message.includes('HostError: Error(Contract, #' + err_code + ')'));
    }
}

async function mint(contract_id, invoker, to, amount) {
    console.log('mint ' + amount + ' to ' + to + ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + invoker + 
                ' -- mint ' + '--to ' + to + ' --amount ' + amount;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("MINT -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("MINT -stdout: " + stdout);
    }
}

async function getBalance(contract_id, invoker, user) {
    console.log('get balance for ' + user + ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + invoker + ' -- balance --id ' + user;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("GET_BALANCE -stderr: " + stderr);
    }

    if (stdout) {
        //console.log("GET_BALANCE -stdout: " + stdout);
    }
    let balance = stdout.trim();
    console.log('balance of ' + user + ': ' + balance);  
    return balance;
}

async function approve(contract_id, from_name, from_id, spender, amount, expirationLedger) {
    console.log('approve from ' + from_id + ' spender ' +  spender + ' amount ' + amount + ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + from_name +
             ' -- approve --from ' + from_id +
             ' --spender ' + spender +
             ' --amount ' + amount +
             ' --expiration_ledger ' + expirationLedger;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("APPROVE -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("APPROVE -stdout: " + stdout);
    }
}

async function getAllowance(contract_id, invoker, from, spender) {
    console.log('get allowance ' + from + ' spender ' +  spender + ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + invoker +
                 ' -- allowance ' + '--from ' + from + ' --spender ' + spender;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("ALLOWANCE -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("ALLOWANCE -stdout: " + stdout);
    }
    return stdout.trim();
}

async function transfer(contract_id, from_name, from_id, to, amount) {
    console.log('transfer ' + from_id + ' to ' + to + ' amount ' + amount +  ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + from_name +
        ' -- transfer ' + '--from ' + from_id +' --to ' + to + ' --amount ' + amount;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("TRANSFER -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("TRANSFER -stdout: " + stdout);
    }
}

async function transfer_err(contract_id, from_name, from_id, to, amount, err_code) {
    console.log('transfer_err test  from ' + from_id + ' to ' + to + ' amount ' + amount +  ' ...');
    try {
        let cmd = cmdInvoke + contract_id + ' --source ' + from_name +
            ' -- transfer ' + '--from ' + from_id +' --to ' + to + ' --amount ' + amount;

        const { error, stdout, stderr } = await exec(cmd);
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
        if (stderr) {
            //console.log("TRANSFER_ERR -stderr: " + stderr);
        }
        if (stdout) {
            //console.log("TRANSFER_ERR -stdout: " + stdout);
        }
    } catch (error) {
        assert(error.message.includes('HostError: Error(Contract, #' + err_code + ')'));
        console.log(`OK`);
    }
}

async function transfer_from(contract_id, spender_name, spender_id, from_id, to, amount) {
    console.log('transfer_from ' + from_id + ' to ' + to + ' spender ' + spender_id +  ' amount ' + amount +  ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + spender_name +
            ' -- transfer_from ' + '--spender ' + spender_id  +
            ' --from ' + from_id + ' --to ' + to + ' --amount ' + amount;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("TRANSFER_FROM -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("TRANSFER_FROM -stdout: " + stdout);
    }
}

async function transfer_from_err(contract_id, spender_name, spender_id, from_id, to, amount, err_code) {
    console.log('transfer_from_err ' + from_id + ' to ' + to + ' spender ' + spender_id +  ' amount ' + amount +  ' ...');
    try {
        let cmd = cmdInvoke + contract_id + ' --source ' + spender_name +
            ' -- transfer_from ' + '--spender ' + spender_id  +
            ' --from ' + from_id + ' --to ' + to + ' --amount ' + amount;
        const { error, stdout, stderr } = await exec(cmd);
        if (error) {
            assert.fail(`error: ${error.message}`);
        }
    } catch (error) {
        assert(error.message.includes('HostError: Error(Contract, #' + err_code + ')'));
        console.log(`OK`);
    }
}

async function set_admin(contract_id, admin_name, new_admin) {
    console.log('set admin ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + admin_name + ' -- set_admin --new_admin ' + new_admin;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("SET_ADMIN -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("SET_ADMIN -stdout: " + stdout);
    }
}

async function burn_from(contract_id, spender_name, spender_id, from_id, amount) {
    console.log('burn_from - from ' + from_id + ' spender ' + spender_id + ' amount ' + amount +  ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + spender_name +
             ' -- burn_from --spender ' + spender_id +
             ' --from ' + from_id + ' --amount ' + amount;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("BURN_FROM -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("BURN_FROM -stdout: " + stdout);
    }
}

async function burn(contract_id, from_name, from_id, amount) {
    console.log('burn - from ' + from_id  + ' amount ' + amount +  ' ...');
    let cmd = cmdInvoke + contract_id + ' --source ' + from_name + ' -- burn ' + '--from ' + from_id + ' --amount ' + amount;
    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        //console.log("BURN -stderr: " + stderr);
    }
    if (stdout) {
        //console.log("BURN -stdout: " + stdout);
    }
}

startTest()