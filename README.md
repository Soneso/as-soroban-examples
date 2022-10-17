# [Stellar Soroban Examples for AssemblyScript](https://github.com/Soneso/as-soroban-examples)

![v0.0.1](https://img.shields.io/badge/v0.0.1-yellow.svg)

AssemblyScript contract examples for [Soroban](https://soroban.stellar.org).

Uses the [AssemblyScript soroban SDK](https://github.com/Soneso/as-soroban-sdk)

**This repository contains code that is in early development, incomplete, not tested, and not recommended for use. The Examples and the SDK are unstable, experimental, and are receiving breaking changes frequently.**

## Quick Start

### 1. Clone this repo
### 2. Install the soroban cli

To run a contract, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
$ cargo install --locked soroban-cli
```

### 3. Run an example contract

Navigate to the directory of the example you would like to run. E.g.

```shell
$ cd hello_word
```

Build the contract:
```shell
$ asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (Text format of the .wasm).

Now you can run the example contract:

```shell
$ soroban invoke --wasm build/release.wasm --id 6 --fn hello --arg friend
```

### 4. Create your own contract

See: [AssemblyScript soroban SDK](https://github.com/Soneso/as-soroban-sdk)
