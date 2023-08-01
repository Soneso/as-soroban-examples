# Token Example

The [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token) demonstrates how to write a token contract that implements the Stellar [token interface](https://soroban.stellar.org/docs/reference/interfaces/token-interface).

## Outdated

This example is outdated and needs to be updated to support soroban preview version 10. It currently supports soroban preview version 9.

## Run the example

To run a contract in the sandbox, you must first install the official `soroban cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 0.8.0 soroban-cli
```

Then, to run the example, navigate it's directory, install the sdk and build the contract:

```sh
cd token
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the ```build``` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Run the test:

```sh
node testContract.cjs
```

## Code
You can find the code in the [token directory](https://github.com/Soneso/as-soroban-examples/tree/main/token).

Entry point is [index.ts](https://github.com/Soneso/as-soroban-examples/tree/main/token/assembly/index.ts).

## How it works

It implements the Stellar [token interface](https://soroban.stellar.org/docs/reference/interfaces/token-interface).
