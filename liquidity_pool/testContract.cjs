const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = "'Test SDF Network ; September 2015'";
const friendbotUrl = 'https://friendbot.stellar.org?addr=';
const network = '--network testnet ';

//const rpcUrl = 'https://rpc-futurenet.stellar.org';
//const networkPassphrase = "'Test SDF Future Network ; October 2022'";
//const friendbotUrl = 'https://friendbot-futurenet.stellar.org?addr=';

const jsonrpcErr = 'error: jsonrpc error:';
const sleepCmd = 5000;

async function startTest() {
    console.log(`test liquidity pool ...`);
    
    await buildLPContract();
    await buildTokenContract();

    let admin = "admin";
    let admin_id = await generateIdentity(admin);
    //await fundAccount(admin_id);

    let user = "user";
    let user_id = await generateIdentity(user);
    //await fundAccount(user_id);

    let lp_cid = await deployContract(admin, 'build/release.wasm');
    console.log("lp cid: " + lp_cid);

    let wasm_hash = await installTokenContract(admin);
    console.log("wasm hash: " + wasm_hash);
    let token_cid_a = await deployContract(admin, '../token/build/release.wasm');
    let token_cid_b = await deployContract(admin, '../token/build/release.wasm');

    if (token_cid_a > token_cid_b) {
        let tmp_cid = token_cid_b;
        token_cid_b = token_cid_a;
        token_cid_a = tmp_cid;
    }
    
    console.log("token a cid: " + token_cid_a);
    console.log("token b cid: " + token_cid_b);

    try {
        await initializeLP(admin, lp_cid, wasm_hash, token_cid_a, token_cid_b);
        let share_id = await get_share_addr(admin, lp_cid);
        console.log("share cid: " + share_id);
    
        // create tokens
        await createToken(admin, admin_id, token_cid_a, "'token a'", "TOKENA");
        await createToken(admin, admin_id, token_cid_b, "'token b'", "TOKENB");
    
    
        await mint(admin, user_id, 1000, token_cid_a);
        let balance = await getBalance(admin, user_id, token_cid_a);
        assert.equal(balance, '"1000"');
    
        await mint(admin, user_id, 1000, token_cid_b);
        balance = await getBalance(admin, user_id, token_cid_b);
        assert.equal(balance, '"1000"');
    
        await depositLP(user, user_id, lp_cid, 100, 100, 100, 100);
        balance = await getBalance(admin, user_id, share_id);
        assert.equal(balance, '"100"');
    
        balance = await getBalance(admin, lp_cid, share_id);
        assert.equal(balance, '"0"');
    
        balance = await getBalance(admin, user_id, token_cid_a);
        assert.equal(balance, '"900"');
    
        balance = await getBalance(admin, lp_cid, token_cid_a);
        assert.equal(balance, '"100"');
    
        balance = await getBalance(admin, user_id, token_cid_b);
        assert.equal(balance, '"900"');
    
        balance = await getBalance(admin, lp_cid, token_cid_b);
        assert.equal(balance, '"100"');
        
        console.log('deposit ok');
    
        await swapLP(user, user_id, lp_cid, 0, 49, 100); // replace 0 with false as soon as the cli accepts it
    
        balance = await getBalance(admin, user_id, token_cid_a);
        assert.equal(balance, '"803"');
        balance = await getBalance(admin, lp_cid, token_cid_a);
        assert.equal(balance, '"197"');
        balance = await getBalance(admin, user_id, token_cid_b);
        assert.equal(balance, '"949"');
        balance = await getBalance(admin, lp_cid, token_cid_b);
        assert.equal(balance, '"51"');
    
        console.log('swap ok');
    
        await withdrawLP(user, user_id, lp_cid, 100, 197, 51);
    
        balance = await getBalance(admin, user_id, token_cid_a);
        assert.equal(balance, '"1000"');
        balance = await getBalance(admin, user_id, token_cid_b);
        assert.equal(balance, '"1000"');
        balance = await getBalance(admin, user_id, share_id);
        assert.equal(balance, '"0"');
    
    
        balance = await getBalance(admin, lp_cid, token_cid_a);
        assert.equal(balance, '"0"');
        balance = await getBalance(admin, lp_cid, token_cid_b);
        assert.equal(balance, '"0"');
        balance = await getBalance(admin, lp_cid, share_id);
        assert.equal(balance, '"0"');
    
        console.log('withdraw ok');
    
        console.log('test liquidity pool -> OK');
    } catch(error) {
        if (error.message.includes(jsonrpcErr)) {
            console.log(`Catched err ` + error);
            console.log("retrying test after 5 seconds")
            await sleep(5000); 
            await startTest();
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
} 

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

async function deployContract(invoker, path) {
    try {
        console.log("deploy contract " + path +  " ...")
        let cmd = 'stellar contract deploy'
        + ' --wasm ' + path + 
        ' --source ' + invoker + 
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
            return await deployContract(invoker, path);
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
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

async function installTokenContract(invoker) {
    try {
        console.log("install token contract ...");
        const { error, stdout, stderr } = await exec('stellar contract install --wasm ../token/build/release.wasm ' + 
        '--source ' + invoker + 
        ' --rpc-url ' + rpcUrl +
        ' --network-passphrase ' + networkPassphrase);
    
        if (error) {
            console.log(error);
        }
        if (stderr) {
            console.log("installTokenContract - stderr: " + stderr);
        }
        sleep(sleepCmd);
        return stdout.trim(); // wasm id
    } catch(error) {
        if (error.message.includes(jsonrpcErr)) {
            console.log(`Catched err ` + error);
            console.log("retrying after 5 seconds")
            await sleep(5000); 
            return await installTokenContract(invoker);
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
}

async function initializeLP(invoker, lp_contract_id, token_wasm_hash , token_a, token_b) {
    console.log("init lp contract ...");
    let cmd = 'stellar -q contract invoke --source ' + invoker + ' --rpc-url ' + rpcUrl +
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
    sleep(sleepCmd);
    return stdout.trim();
}

async function depositLP(invoker, user_id, lp_contract_id, desired_a, min_a, desired_b, min_b) {
    console.log("deposit lp ...");
    let cmd = 'stellar -q contract invoke --source ' + invoker + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' --fee 1000000 -- deposit --to ' + user_id 
    + ' --desired_a '+ desired_a + ' --min_a ' + min_a
    + ' --desired_b '+ desired_b + ' --min_b ' + min_b;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("depositLP - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function swapLP(invoker, user_id, lp_contract_id, buy_a, out, in_max) {
    console.log("swap lp ...");
    let cmd = 'stellar -q contract invoke --source ' + invoker + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' --fee 1000000 -- swap --to ' + user_id 
    + ' --buy_a '+ buy_a + ' --out ' + out
    + ' --in_max '+ in_max;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("swapLP - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function withdrawLP(invoker, user_id, lp_contract_id, share_amount, min_a, min_b) {
    console.log("withdraw lp ...");
    let cmd = 'stellar -q contract invoke --source ' + invoker + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' --fee 1000000 -- withdraw --to ' + user_id 
    + ' --share_amount '+ share_amount + ' --min_a ' + min_a
    + ' --min_b '+ min_b;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("withdrawLP - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function get_share_addr(invoker, lp_contract_id) {
    console.log("get share addr lp ...");
    let cmd = 'stellar -q contract invoke --source ' + invoker + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + lp_contract_id 
    + ' -- share_addr';

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("get_share_addr - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function createToken(invoker, adminId, token_contract_id, name , symbol) {
    console.log("create token ...");
    let cmd = 'stellar -q contract invoke --source ' + invoker + ' --rpc-url ' + rpcUrl +
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
    sleep(sleepCmd);
    return stdout.trim();
}

async function mint(invoker, to, amount, token_contract_id) {
    console.log("mint ...");
    const { error, stdout, stderr } = await exec('stellar -q contract invoke' + 
    ' --source ' + invoker + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id + ' -- mint --to ' + to + ' --amount ' + amount);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("mint - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim();
}

async function getBalance(invoker, user, token_contract_id) {
    console.log("get balance ...");
    let cmd = 'stellar -q contract invoke ' +
    '--source ' + invoker + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id ' + token_contract_id + ' -- balance --id ' + user;

    const { error, stdout, stderr } = await exec(cmd);

    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("getBalance - stderr: " + stderr);
    }
    sleep(sleepCmd);
    return stdout.trim(); // balance
}

async function generateIdentity(name) {
    const { error, stdout, stderr } = await exec('stellar keys generate ' + network
    + name + ' && stellar keys address ' + name);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    return stdout.trim();
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

startTest()