# Liquidity pool

The [liquidity pool example](https://github.com/Soneso/as-soroban-examples/tree/main/liquidity_pool) demonstrates how to write a constant product liquidity pool contract.

## Run the example

First, install the official `stellar-cli` as described here: [stellar cli](https://soroban.stellar.org/docs/getting-started/setup).

```sh
cargo install --locked stellar-cli
```

Then, navigate it's directory and install the sdk.

```sh
cd liquidity_pool
npm install
```

You can now run the test:

```sh
node testContract.cjs
```

The comments in the [source code](https://github.com/Soneso/as-soroban-examples/tree/main/liquidity_pool/assembly/index.ts) explain how the contract should be used.