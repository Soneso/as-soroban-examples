# [Stellar Soroban Examples for AssemblyScript](https://github.com/Soneso/as-soroban-examples)

![v0.3.0](https://img.shields.io/badge/v0.3.0-green.svg)

AssemblyScript contract examples for [Soroban](https://soroban.stellar.org).

Uses the [AssemblyScript soroban SDK](https://github.com/Soneso/as-soroban-sdk)

## Quick Start

### 1. Clone this repo
### 2. Install the soroban cli

To run a contract, you must first install the official `soroban-cli` as described here: [stellar soroban cli](https://soroban.stellar.org/docs/getting-started/setup).

```sh
cargo install --locked soroban-cli
```

### 2.1 Hint for testing with protocol version 21:
Currently the `soroban-cli` version that supports protocol v.21 is not yet officially launched. Therefore, if you would like to test your contracts with the protocol 21 update (testnet, futurenet), you need to install a soroban cli preview version:

```sh
cargo install soroban-cli --version 21.0.0-preview.1
```

Please also uptdate your `package.json` file to use the AssemblyScript Soroban SDK version `1.0.1`.

### 3. Run an example contract

Navigate to the directory of the example you would like to run.

```sh
cd hello_word
```

Install the AS Soroban SDK:

```sh
npm install

```

Build the contract:
```sh
npm run asbuild:release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (Text format of the ```.wasm```).

Run the example contract:

```sh
soroban -q contract invoke --wasm build/release.wasm --id 1 --fn hello -- --to friend
```

### 4. Available examples

Instead of a tutorial, we have created a series of contract examples with many explanations. It is recommended that you work through the examples in the order shown here. 

| Example | Description |
| :--- | :--- |
| [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add)| Demonstrates how to write a simple contract, with a single function that takes two i32 inputs and returns their sum as an output. |
| [hello word example](https://github.com/Soneso/as-soroban-examples/tree/main/hello_word)| demonstrates how to write a simple contract, with a single function that takes an input and returns a vector containing multiple host values. |
| [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment)| Demonstrates how to write a simple contract that stores data, with a single function that increments an internal counter and returns the value. It also shows how to manage contract data lifetimes and how to optimize contracts.|
| [events example](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events)| Demonstrates how to publish events from a contract.|
| [errors example](https://github.com/Soneso/as-soroban-examples/tree/main/errors)| Demonstrates how to define and generate errors in a contract that invokers of the contract can understand and handle.|
| [logging example](https://github.com/Soneso/as-soroban-examples/tree/main/logging)| Demonstrates how to log for the purpose of debugging.|
| [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth)| Demonstrates how to implement authentication and authorization using the [Soroban Host-managed auth framework](https://soroban.stellar.org/docs/learn/authorization).|
| [cross contract call example](https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract)| Demonstrates how to call a contract's function from another contract.|
| [deployer example](https://github.com/Soneso/as-soroban-examples/tree/main/deployer)| Demonstrates how to deploy contracts using a contract.|
| [upgrading contracts example](https://github.com/Soneso/as-soroban-examples/tree/main/upgradeable_contract)| Demonstrates how to upgrade a wasm contract.|
| [testing example](https://github.com/Soneso/as-soroban-examples/tree/main/testing)| Shows a simple way to test your contract.|
| [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token)| Demonstrates how to write a token contract that implements the Stellar [token interface](https://soroban.stellar.org/docs/reference/interfaces/token-interface).|
| [atomic swap example](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap)| Swaps two tokens between two authorized parties atomically while following the limits they set. This example demonstrates advanced usage of Soroban auth framework and assumes the reader is familiar with the auth example and with Soroban token usage.|
| [atomic swap batched example](https://github.com/Soneso/as-soroban-examples/tree/main/multi_swap)| Swaps a pair of tokens between the two groups of users that authorized the swap operation from the [atomic swap example](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap).|
| [timelock example](https://github.com/Soneso/as-soroban-examples/tree/main/timelock)| Demonstrates how to write a timelock and implements a greatly simplified claimable balance similar to the claimable balance feature available on Stellar.|
| [single offer sale example](https://github.com/Soneso/as-soroban-examples/tree/main/single_offer)| The single offer sale example demonstrates how to write a contract that allows a seller to set up an offer to sell token A for token B to multiple buyers.|
| [liquidity pool example](https://github.com/Soneso/as-soroban-examples/tree/main/liquidity_pool)| Demonstrates how to write a constant product liquidity pool contract.|
| [custom account example](https://github.com/Soneso/as-soroban-examples/tree/main/custom_account)| This example is an advanced auth example which demonstrates how to implement a simple account contract that supports multisig and customizable authorization policies.|

### 5. Create your own contract

Use: [AssemblyScript Soroban SDK](https://github.com/Soneso/as-soroban-sdk)
