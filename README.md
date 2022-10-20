# [Stellar Soroban Examples for AssemblyScript](https://github.com/Soneso/as-soroban-examples)

![v0.0.3](https://img.shields.io/badge/v0.0.3-yellow.svg)

AssemblyScript contract examples for [Soroban](https://soroban.stellar.org).

Uses the [AssemblyScript soroban SDK](https://github.com/Soneso/as-soroban-sdk)

**This repository contains code that is in early development, incomplete, not tested, and not recommended for use. The Examples and the SDK are unstable, experimental, and are receiving breaking changes frequently.**

## Quick Start

### 1. Clone this repo
### 2. Install the soroban cli

To run a contract, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

### 3. Run an example contract

Navigate to the directory of the example you would like to run. E.g.

```shell
cd hello_word
```

Install the SDK:

```shell
npm install as-soroban-sdk

```

Build the contract:
```shell
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (Text format of the .wasm).

Now you can run the example contract:

```shell
soroban invoke --wasm build/release.wasm --id 6 --fn hello --arg friend
```

### 4. Avaialable examples

The [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add) demonstrates how to write a simple contract, with a single function that takes two i32 inputs and returns their sum as an outout.

The [hello word example](https://github.com/Soneso/as-soroban-examples/tree/main/hello_word) demonstrates how to write a simple contract, with a single function that takes one input and returns it as an output.

The [increment exammple](https://github.com/Soneso/as-soroban-examples/tree/main/increment) demonstrates how to write a simple contract that stores data, with a single function that increments an internal counter and returns the value.

The [logging exammple](https://github.com/Soneso/as-soroban-examples/tree/main/logging) demonstrates how to log for the purpose of debugging.

The [cross contract call exammple](https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract) demonstrates how to call a contract from another contract.

The [errors exammple](https://github.com/Soneso/as-soroban-examples/tree/main/errors) demonstrates how to define and generate errors in a contract that invokers of the contract can understand and handle.

The [events exammple](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events) demonstrates how to publish events from a contract.

### 5. Create your own contract

Use: [AssemblyScript soroban SDK](https://github.com/Soneso/as-soroban-sdk)
