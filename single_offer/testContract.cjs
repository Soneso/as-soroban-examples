const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = "'Test SDF Network ; September 2015'";
//const rpcUrl = 'https://rpc-futurenet.stellar.org';
//const networkPassphrase = "'Test SDF Future Network ; October 2022'";

const adminSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57";
const adminId = "GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T";
const sellerSeed = "SD67PZDY26PAIHROO76HWDJLWTOPEZHUNSIT4P4DBXIIGVJB2VWFLNNN";
const sellerId = "GC66BENPKDEEV32FXOFSFP3GJTGPZLI6N3A67CY3IBEABBKBGZENRODJ";
const buyerSeed = "SD273YPYQB3VKH6TYCWBK5NQVCA6UYBK7WLCG7FXB6JJUCEBPNL6BAFE";
const buyerId = "GBBCN7YRBOOWWDCHY6MCK4Y2VQSFMFDTGTXFJ4Z7BLJ7LC5RRI42XHE3";
const sleepCmd = 5000;
const jsonrpcErr = 'error: jsonrpc error:';

async function startTest() {
    console.log(`test single offer sale ...`);
    
    // prepare contracts
    await build_offer_contract();
    await build_token_contract();

    let offer_cid = await deploy_offer_contract();
    await sleep(sleepCmd); 
    let sell_token_cid = await deploy_token_contract("sell token");
    await sleep(sleepCmd); 
    let buy_token_cid = await deploy_token_contract("buy token");
    await sleep(sleepCmd); 

    // create tokens
    await create_token(sell_token_cid, "'sell token'", "SELLTOK");
    await sleep(sleepCmd); 
    await create_token(buy_token_cid, "'buy token'", "BUYTOK");
    await sleep(sleepCmd); 

    // Give some sell_token to seller and buy_token to buyer.
    await mint(sellerId, 1000, sell_token_cid);
    await sleep(sleepCmd); 
    let balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"1000"');
    await sleep(sleepCmd); 
    await mint(buyerId, 1000, buy_token_cid);
    await sleep(sleepCmd); 
    balance = await getBalance(buyerId, buy_token_cid);
    assert.equal(balance, '"1000"');
    await sleep(sleepCmd); 

    // Deposit 100 sell_token from seller into offer.
    await transfer(sellerSeed, sellerId, offer_cid, 100, sell_token_cid);
    await sleep(sleepCmd); 
    balance = await getBalance(offer_cid, sell_token_cid);
    assert.equal(balance, '"100"');
    await sleep(sleepCmd); 

    // Create offer
    await create_offer(sellerSeed, sellerId, sell_token_cid, buy_token_cid, 1, 2, offer_cid);
    await sleep(sleepCmd); 

    // Try trading 20 buy_token for at least 11 sell_token - that wouldn't
    // succeed because the offer price would result in 10 sell_token.
    try {
        let error = await trade_err(buyerSeed, buyerId, 20, 11, offer_cid);
        assert.equal(true, error.includes('HostError: Error(Contract, #4)'));
        await sleep(sleepCmd); 
    } catch (error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #4)'));
    }

    // Buyer trades 20 buy_token for 10 sell_token.
    await trade(buyerSeed, buyerId, 20, 10, offer_cid);
    await sleep(sleepCmd); 

    balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"900"');
    await sleep(sleepCmd); 

    balance = await getBalance(buyerId, sell_token_cid);
    assert.equal(balance, '"10"');
    await sleep(sleepCmd); 

    balance = await getBalance(offer_cid, sell_token_cid);
    assert.equal(balance, '"90"');
    await sleep(sleepCmd); 

    balance = await getBalance(sellerId, buy_token_cid);
    assert.equal(balance, '"20"');
    await sleep(sleepCmd); 

    balance = await getBalance(buyerId, buy_token_cid);
    assert.equal(balance, '"980"');
    await sleep(sleepCmd); 

    balance = await getBalance(offer_cid, buy_token_cid);
    assert.equal(balance, '"0"');
    await sleep(sleepCmd); 

    // Withdraw 70 sell_token from offer.
    await withdraw(sellerSeed, sell_token_cid, 70, offer_cid);
    await sleep(sleepCmd); 
    balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"970"');
    await sleep(sleepCmd); 
    balance = await getBalance(offer_cid, sell_token_cid);
    assert.equal(balance, '"20"');
    await sleep(sleepCmd); 

    // The price here is 1 sell_token = 1 buy_token.
    await updt_price(sellerSeed, 1, 1, offer_cid);
    await sleep(sleepCmd); 
    // Buyer trades 10 buy_token for 10 sell_token.
    await trade(buyerSeed, buyerId, 10, 10, offer_cid);
    await sleep(sleepCmd); 

    balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"970"');
    await sleep(sleepCmd); 
    balance = await getBalance(buyerId, sell_token_cid);
    assert.equal(balance, '"20"');
    await sleep(sleepCmd); 
    balance = await getBalance(offer_cid, sell_token_cid);
    assert.equal(balance, '"10"');
    await sleep(sleepCmd); 
    balance = await getBalance(sellerId, buy_token_cid);
    assert.equal(balance, '"30"');
    await sleep(sleepCmd); 
    balance = await getBalance(buyerId, buy_token_cid);
    assert.equal(balance, '"970"');
    await sleep(sleepCmd); 
    balance = await getBalance(offer_cid, buy_token_cid);
    assert.equal(balance, '"0"');

    console.log(`test single offer sale -> OK`);
} 

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function build_token_contract() {
    const { error, stdout, stderr } = await exec('cd ../token && npm run asbuild:release && cd ../single_offer');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("build_token_contract - stderr: " + stderr);
    }
    console.log(stdout);
}

async function deploy_token_contract(name) {
    try {
        const { error, stdout, stderr } = await exec('stellar contract deploy --wasm ../token/build/release.wasm ' + 
        '--source ' + adminSeed + 
        ' --rpc-url ' + rpcUrl +
        ' --network-passphrase ' + networkPassphrase);
    
        if (error) {
            console.log(error);
        }
        if (stderr) {
            console.log("deploy_token_contract - stderr: " + stderr);
        }
        console.log(name + " contract address: " + stdout);
        return stdout.trim(); // contract address
    } catch(error) {
        if (error.message.includes(jsonrpcErr)) {
            console.log(`Catched err ` + error);
            console.log("retrying after 5 seconds")
            await sleep(5000); 
            return await deploy_token_contract(name);
        } else {
            assert.fail(`error: ${error.message}`);
        }
    }
}

async function build_offer_contract() {
    const { error, stdout, stderr } = await exec('npm run asbuild:release');
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("build_offer_contract - stderr: " + stderr);
    }
    console.log(stdout);
}

async function deploy_offer_contract() {
    let cmd = 'stellar contract deploy'
    + ' --wasm build/release.wasm' + 
    ' --source ' + adminSeed + 
    ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("deploy_offer_contract - stderr: " + stderr);
    }
    console.log("offer contract address: " + stdout);
    return stdout.trim(); // contract address
}

async function create_token(token_contract_id, name , symbol) {
    let cmd = 'stellar -q contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + token_contract_id 
    + ' -- initialize --admin ' + adminId 
    + ' --decimal 8 --name '+ name + ' --symbol ' + symbol;

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("create_token - stderr: " + stderr);
    }
    return stdout.trim();
}

async function mint(to, amount, token_contract_id) {
    const { error, stdout, stderr } = await exec('stellar -q contract invoke' + 
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
    let cmd = 'stellar -q contract invoke ' +
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

async function create_offer(seller_seed, seller_id, sell_token, buy_token, sell_price, buy_price, offer_contract_id) {
    let cmd = 'stellar -q contract invoke --source ' + seller_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + offer_contract_id 
    + ' -- create --seller ' + seller_id 
    + ' --sell_token ' + sell_token + ' --buy_token ' + buy_token + ' --sell_price ' + sell_price + ' --buy_price ' + buy_price;

    //console.log(cmd);

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("create_offer - stderr: " + stderr);
    }
    return stdout.trim();
}

async function trade(buyer_seed, buyer_id, buy_amount, sell_amount, offer_contract_id) {
    let cmd = 'stellar -q contract invoke --source ' + buyer_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + offer_contract_id 
    + ' -- trade --buyer ' + buyer_id 
    + ' --buy_token_amount ' + buy_amount + ' --min_sell_token_amount ' + sell_amount;

    //console.log(cmd);

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("trade - stderr: " + stderr);
    }
    return stdout.trim();
}

async function trade_err(buyer_seed, buyer_id, buy_amount, sell_amount, offer_contract_id) {
    let cmd = 'stellar -q contract invoke --source ' + buyer_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + offer_contract_id 
    + ' -- trade --buyer ' + buyer_id 
    + ' --buy_token_amount ' + buy_amount + ' --min_sell_token_amount ' + sell_amount;

    console.log(cmd);

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        return error;
    }
    if (stderr) {
        console.log("trade_err - stderr: " + stderr);
        return stderr;
    }
    return stdout.trim();
}

async function withdraw(seller_seed, token, amount, offer_contract_id) {
    let cmd = 'stellar -q contract invoke --source ' + seller_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + offer_contract_id 
    + ' -- withdraw --token ' + token + ' --amount ' + amount;

    //console.log(cmd);

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("withdraw - stderr: " + stderr);
    }
    return stdout.trim();
}

async function updt_price(seller_seed, sell_price, buy_price, offer_contract_id) {
    let cmd = 'stellar -q contract invoke --source ' + seller_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase +' --id ' + offer_contract_id 
    + ' -- updt_price --sell_price ' + sell_price + ' --buy_price ' + buy_price;

    console.log(cmd);

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        console.log(error);
    }
    if (stderr) {
        console.log("updt_price - stderr: " + stderr);
    }
    return stdout.trim();
}

async function transfer(from_seed, from, to, amount, token_contract_id) {
    let cmd = 'soroban -q contract invoke --source ' + from_seed + ' --rpc-url ' + rpcUrl +
    ' --network-passphrase ' + networkPassphrase + ' --id '+ token_contract_id + ' -- transfer ' +
    '--from ' + from +' --to ' + to + ' --amount ' + amount;
    console.log(cmd);

    const { error, stdout, stderr } = await exec(cmd);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("transfer - stderr: " + stderr);
    }
}

startTest()