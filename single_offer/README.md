# Single offer sale

The [single offer sale example](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer) demonstrates how to write a contract that allows a seller to set up an offer to sell token A for token B to multiple buyers. 


## Run the example

First, install the official `stellar-cli` as described here: [stellar cli](https://soroban.stellar.org/docs/getting-started/setup).

```sh
cargo install --locked stellar-cli
```

Then, navigate it's directory and install the sdk.

```sh
cd single_offer
npm install
```

You can now run the test:

```sh
node testContract.cjs
```

The comments in the [source code](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer/assembly/index.ts) explain how the contract should be used.