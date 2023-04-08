const { exec } = require("child_process");
var assert = require('assert');

exec("soroban contract invoke --id 1 --wasm build/release.wasm -- add --a 1 --b 5", (error, stdout, stderr) => {
    if (error) {
        assert.fail(`error: ${error.message}`);
    }
    if (stderr) {
        assert.fail(`stderr: ${stderr}`);
    }
    assert.equal(stdout, 6);
    console.log(`OK`);
});