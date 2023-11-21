const util = require('util');
const exec = util.promisify(require('child_process').exec);
let assert = require('assert');

const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = "'Test SDF Network ; September 2015'";
const adminSeed = "SANB7KW6E65BEP6WKTELQ7FMDZTN7HRDMXERYQVLYYO32RK2FOHWBK57";
const adminId = "GCWXCVSG7R45HWGOXUJPSEQ5TOOMTMF4OKTDKNCT5AAVKDZTFLO3JR2T";
const sellerSeed = "SD67PZDY26PAIHROO76HWDJLWTOPEZHUNSIT4P4DBXIIGVJB2VWFLNNN";
const sellerId = "GC66BENPKDEEV32FXOFSFP3GJTGPZLI6N3A67CY3IBEABBKBGZENRODJ";
const buyerSeed = "SD273YPYQB3VKH6TYCWBK5NQVCA6UYBK7WLCG7FXB6JJUCEBPNL6BAFE";
const buyerId = "GBBCN7YRBOOWWDCHY6MCK4Y2VQSFMFDTGTXFJ4Z7BLJ7LC5RRI42XHE3";

async function startTest() {
    console.log(`test single offer sale ...`);
    
    // prepare contracts
    await build_offer_contract();
    await build_token_contract();
    await pipInstallPythonSDK();

    let offer_contract_address = await deploy_offer_contract();
    let offer_cid = await idForContractAddress(offer_contract_address);
    let sell_token_addr = await deploy_token_contract("sell token");
    let sell_token_cid = await idForContractAddress(sell_token_addr);
    let buy_token_addr = await deploy_token_contract("buy token");
    let buy_token_cid = await idForContractAddress(buy_token_addr);

    // create tokens
    await create_token(sell_token_cid, "53454c4c544f4b", "53454c4c544f4b"); // "SELLTOK"
    await create_token(buy_token_cid, "425559544f4b", "425559544f4b"); // "BUYTOK"

    // Give some sell_token to seller and buy_token to buyer.
    await mint(sellerId, 1000, sell_token_cid);
    let balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"1000"');
    await mint(buyerId, 1000, buy_token_cid);
    balance = await getBalance(buyerId, buy_token_cid);
    assert.equal(balance, '"1000"');

    // Deposit 100 sell_token from seller into offer.
    await transfer(sellerSeed, sellerId, offer_contract_address, 100, sell_token_cid);
    balance = await getBalance(offer_contract_address, sell_token_cid);
    assert.equal(balance, '"100"');

    // Create offer
    await create_offer(sellerSeed, sellerId, sell_token_addr, buy_token_addr, 1, 2, offer_cid);

    // Try trading 20 buy_token for at least 11 sell_token - that wouldn't
    // succeed because the offer price would result in 10 sell_token.
    try {
        let error = await trade_err(buyerSeed, buyerId, 20, 11, offer_cid);
        assert.equal(true, error.includes('HostError: Error(Contract, #4)'));
    } catch (error) {
        assert.equal(true, error.message.includes('HostError: Error(Contract, #4)'));
    }

    // Buyer trades 20 buy_token for 10 sell_token.
    await trade(buyerSeed, buyerId, 20, 10, offer_cid);

    balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"900"');
    balance = await getBalance(buyerId, sell_token_cid);
    assert.equal(balance, '"10"');
    balance = await getBalance(offer_contract_address, sell_token_cid);
    assert.equal(balance, '"90"');
    balance = await getBalance(sellerId, buy_token_cid);
    assert.equal(balance, '"20"');
    balance = await getBalance(buyerId, buy_token_cid);
    assert.equal(balance, '"980"');
    balance = await getBalance(offer_contract_address, buy_token_cid);
    assert.equal(balance, '"0"');

    // Withdraw 70 sell_token from offer.
    await withdraw(sellerSeed, sell_token_addr, 70, offer_cid);
    balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"970"');
    balance = await getBalance(offer_contract_address, sell_token_cid);
    assert.equal(balance, '"20"');

    // The price here is 1 sell_token = 1 buy_token.
    await updt_price(sellerSeed, 1, 1, offer_cid);

    // Buyer trades 10 buy_token for 10 sell_token.
    await trade(buyerSeed, buyerId, 10, 10, offer_cid);

    balance = await getBalance(sellerId, sell_token_cid);
    assert.equal(balance, '"970"');
    balance = await getBalance(buyerId, sell_token_cid);
    assert.equal(balance, '"20"');
    balance = await getBalance(offer_contract_address, sell_token_cid);
    assert.equal(balance, '"10"');
    balance = await getBalance(sellerId, buy_token_cid);
    assert.equal(balance, '"30"');
    balance = await getBalance(buyerId, buy_token_cid);
    assert.equal(balance, '"970"');
    balance = await getBalance(offer_contract_address, buy_token_cid);
    assert.equal(balance, '"0"');

    console.log(`test single offer sale -> OK`);
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
    const { error, stdout, stderr } = await exec('soroban contract deploy --wasm ../token/build/release.wasm ' + 
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
        console.log("deploy_offer_contract - stderr: " + stderr);
    }
    console.log("offer contract address: " + stdout);
    return stdout.trim(); // contract address
}

async function create_token(token_contract_id, name , symbol) {
    let cmd = 'soroban -q contract invoke --source ' + adminSeed + ' --rpc-url ' + rpcUrl +
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

async function create_offer(seller_seed, seller_id, sell_token, buy_token, sell_price, buy_price, offer_contract_id) {
    let cmd = 'soroban -q contract invoke --source ' + seller_seed + ' --rpc-url ' + rpcUrl +
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
    let cmd = 'soroban -q contract invoke --source ' + buyer_seed + ' --rpc-url ' + rpcUrl +
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
    let cmd = 'soroban -q contract invoke --source ' + buyer_seed + ' --rpc-url ' + rpcUrl +
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
    let cmd = 'soroban -q contract invoke --source ' + seller_seed + ' --rpc-url ' + rpcUrl +
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
    let cmd = 'soroban -q contract invoke --source ' + seller_seed + ' --rpc-url ' + rpcUrl +
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

async function pipInstallPythonSDK() {
    let pip = 'pip3 install git+https://github.com/StellarCN/py-stellar-base.git'; // 'pip3 install -U stellar-sdk'
    const { error, stdout, stderr } = await exec(pip);
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        console.log("pipInstallPythonSDK - stderr: " + stderr);
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