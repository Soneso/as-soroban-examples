# Single offer sale

The [single offer sale example](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer) demonstrates how to write a contract that allows a seller to set up an offer to sell token A for token B to multiple buyers. 

## Outdated

This example is outdated and needs to be updated to support soroban preview version 10. It currently supports soroban preview version 9.

## Run the example

First, install the official `soroban-cli` as described here: [stellar soroban cli](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli).

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
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