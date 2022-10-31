const { exec } = require("child_process");
var assert = require('assert');

exec("soroban invoke --id 1 --wasm build/release.wasm --fn add --arg 1 --arg 5", (error, stdout, stderr) => {
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    assert.equal(stdout, 6);
    console.log(`OK`);
});