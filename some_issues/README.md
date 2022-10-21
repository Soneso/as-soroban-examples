# Some Issues

The [issues example](https://github.com/Soneso/as-soroban-examples/tree/main/some_issues) shows some problems that we have while developing with assembly script.


## Run the example

To run a contract in the sandbox, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

Then, to run the example, navigate it's directory install the sdk. Then build the contract:

```shell
cd some_issues
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Now you can execute a function from the contract:

```shell
soroban invoke --wasm build/release.wasm --id 1 --fn add_str
```

## Issue 1: Add Strings
This is the first issue. Adding two strings fails:

```typescript
let a = "b" + "c";
```
Ref: https://github.com/Soneso/as-soroban-examples/blob/main/some_issues/assembly/index.ts

Edit the code, compile and run the function "add_str" to reproduce:

```
asc assembly/index.ts --target release
soroban invoke --wasm build/release.wasm --id 1 --fn add_str
```

You should get following error:

````
error: HostError
Value: Status(VmError(Validation))

Debug events (newest first):
0: "Validation"
```