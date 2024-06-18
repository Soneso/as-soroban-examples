# Batched atomic swap

The [multi swap example](https://github.com/Soneso/as-soroban-examples/tree/main/multi_swap) swaps a pair of tokens between the two groups of users that authorized the swap operation from the [atomic swap example](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap).

This contract basically batches the multiple swaps while following some simple rules to match the swap participants.

Follow the comments in the code for more information.

## Run the example

First, install the official `stellar-cli` as described here: [stellar cli](https://soroban.stellar.org/docs/getting-started/setup).

```sh
cargo install --locked stellar-cli
```

Then, navigate it's directory and install the sdk.

```sh
cd multi_swap
npm install
```

You can now run the test:

```sh
node testContract.cjs
```

The comments in the [source code](https://github.com/Soneso/as-soroban-examples/tree/main/multi_swap/assembly/index.ts) explain how the contract should be used.