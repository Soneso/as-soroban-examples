# Sngle offer sale

The [single offer sale example](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer) demonstrates how to write a contract that allows a seller to set up an offer to sell token A for token B to multiple buyers. 

## Run the example

First, install the official `soroban-cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 0.7.0 soroban-cli
```

Then, navigate it's directory and install the sdk.

```sh
cd single_offer
npm install as-soroban-sdk
```

You can now run the test:

```sh
node testContract.cjs
```

The comments in the [source code](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer/assembly/index.ts) explain how the contract should be used.