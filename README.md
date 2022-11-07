# [Stellar Soroban Examples for AssemblyScript](https://github.com/Soneso/as-soroban-examples)

![v0.0.6](https://img.shields.io/badge/v0.0.6-yellow.svg)

AssemblyScript contract examples for [Soroban](https://soroban.stellar.org).

Uses the [AssemblyScript soroban SDK](https://github.com/Soneso/as-soroban-sdk)

**This repository contains code that is in early development, incomplete, not tested, and not recommended for use. The Examples and the SDK are unstable, experimental, and are receiving breaking changes frequently.**

## Quick Start

### 1. Clone this repo
### 2. Install the soroban cli

To run a contract, you must first install the official ```soroban-cli``` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

### 3. Run an example contract

Navigate to the directory of the example you would like to run.

```shell
cd hello_word
```

Install the AS Soroban SDK:

```shell
npm install as-soroban-sdk

```

Build the contract:
```shell
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (Text format of the ```.wasm```).

Run the example contract:

```shell
soroban invoke --wasm build/release.wasm --id 1 --fn hello --arg friend
```

### 4. Available examples

| Example | Description |
| :--- | :--- |
| [add example](https://github.com/Soneso/as-soroban-examples/tree/main/add)| Demonstrates how to write a simple contract, with a single function that takes two i32 inputs and returns their sum as an output. |
| [hello word example](https://github.com/Soneso/as-soroban-examples/tree/main/hello_word)| Demonstrates how to write a simple contract, with a single function that takes one input and returns it as an output. |
| [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment)| Demonstrates how to write a simple contract that stores data, with a single function that increments an internal counter and returns the value.| 
| [logging example](https://github.com/Soneso/as-soroban-examples/tree/main/logging)| Demonstrates how to log for the purpose of debugging.|
| [cross contract call example](https://github.com/Soneso/as-soroban-examples/tree/main/cross_contract)| Demonstrates how to call a contract from another contract.|
| [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth)| Demonstrates how to tell who has invoked a contract, and verify that a contract has been invoked by an account or contract.|
| [errors example](https://github.com/Soneso/as-soroban-examples/tree/main/errors)| Demonstrates how to define and generate errors in a contract that invokers of the contract can understand and handle.|
| [events example](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events)| Demonstrates how to publish events from a contract.|
| [testing example](https://github.com/Soneso/as-soroban-examples/tree/main/testing)| Shows a simple way to test your contract.|

### 5. Create your own contract

Use: [AS Soroban SDK](https://github.com/Soneso/as-soroban-sdk)