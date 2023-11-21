# Liquidity pool

The [liquidity pool example](https://github.com/Soneso/as-soroban-examples/tree/main/liquidity_pool) demonstrates how to write a constant product liquidity pool contract.

## Run the example

First, install the official `soroban-cli` as described here: [stellar soroban cli](https://soroban.stellar.org/docs/getting-started/setup).

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

Then, navigate it's directory and install the sdk.

```sh
cd liquidity_pool
npm install as-soroban-sdk
```

You can now run the test:

```sh
node testContract.cjs
```

The comments in the [source code](https://github.com/Soneso/as-soroban-examples/tree/main/liquidity_pool/assembly/index.ts) explain how the contract should be used.