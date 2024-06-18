# Logging

The [logging example](https://github.com/Soneso/as-soroban-examples/tree/main/logging) demonstrates how to log for the purpose of debugging.


## Run the example

To run a contract, you must first install the official [stellar-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked stellar-cli
```

Then, to run the example, navigate it's directory install the sdk. Then build the contract:

```sh
cd logging
npm install
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Deploy the example contract:

```sh
stellar contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

This returns the ID of the contract, starting with a C. Similar to this:

```sh
CB2MB6RW5SZGBOWSKUCLHWQXYB4KLHCI4Y5JBCKRXIZWNOFY2S6HAXCE
```
Logging emits DIAGNOSTIC events. Before we invoke the contract, let's first get the latest ledger sequence number. We will need it to fetch the events after invoking the contract:

```sh
curl -X POST \
    -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":"1234","method":"getLatestLedger"}' \
    https://soroban-testnet.stellar.org/
```

The output should be something like this:

```sh
{"jsonrpc":"2.0","id":"1234","result":{"id":"523a4f3552fe9e1a090860495fbf3a0608e3300f9f6e860c800312c1f44da9a3","protocolVersion":21,"sequence":116751}}
```
In the upper result, the latest ledger sequence number is `116751`.

Next let's invoke:

```sh
stellar contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- logging
```

Fetch the events:

```sh
stellar events --start-ledger <ledger sequence>  \
    --id <contract id> \
    --rpc-url https://soroban-testnet.stellar.org \
    --network-passphrase "Test SDF Network ; September 2015"
```

You should see the output:

```sh
Event 0000501471791652864-0000000001 [DIAGNOSTIC]:
  Ledger:   116758 (closed at 2024-06-18T23:20:40Z)
  Contract: CD2V4H5TYKE7H3RKTOR2DOPQXIYCX4YA4O4K2IBIYDMUQTDMSFNCW7KR
  Topics:
            Symbol(ScSymbol(StringM(log)))
  Value: String(ScString(StringM(Hello, today is a sunny day!)))
Event 0000501471791652864-0000000002 [DIAGNOSTIC]:
  Ledger:   116758 (closed at 2024-06-18T23:20:40Z)
  Contract: CD2V4H5TYKE7H3RKTOR2DOPQXIYCX4YA4O4K2IBIYDMUQTDMSFNCW7KR
  Topics:
            Symbol(ScSymbol(StringM(log)))
  Value: Vec(Some(ScVec(VecM([String(ScString(StringM(Temperature today:))), I32(30), Symbol(ScSymbol(StringM(celsius)))]))))
Event 0000501471791652864-0000000003 [DIAGNOSTIC]:
  Ledger:   116758 (closed at 2024-06-18T23:20:40Z)
  Contract: CD2V4H5TYKE7H3RKTOR2DOPQXIYCX4YA4O4K2IBIYDMUQTDMSFNCW7KR
  Topics:
            Symbol(ScSymbol(StringM(log)))
  Value: Vec(Some(ScVec(VecM([String(ScString(StringM(Test))), I32(-12)]))))
Event 0000501471791652864-0000000004 [DIAGNOSTIC]:
  Ledger:   116758 (closed at 2024-06-18T23:20:40Z)
  Contract: CD2V4H5TYKE7H3RKTOR2DOPQXIYCX4YA4O4K2IBIYDMUQTDMSFNCW7KR
  Topics:
            Symbol(ScSymbol(StringM(fn_return)))
            Symbol(ScSymbol(StringM(logging)))
  Value: Void
Latest Ledger: 116759
```

## Code

You can find the code in:

```sh
logging/assembly/index.ts
```

```typescript
import * as context from 'as-soroban-sdk/lib/context';
import {VoidVal ,fromI32, fromSmallSymbolStr, fromVoid} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function logging(): VoidVal {

  context.logStr("Hello, today is a sunny day!");

  let values = new Vec();
  values.pushBack(fromI32(30));
  values.pushBack(fromSmallSymbolStr("celsius"));
  context.log("Temperature today:", values);

  context.logMgsAndValue("Test", fromI32(-12))
  
  return fromVoid();
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/logging

## How it works

The `context.logStr` method, provided by [as-soroban-sdk](https://github.com/Soneso/as-soroban-sdk), logs a string for debugging purposes. Any logs that occur during execution are outputted to stdout in soroban-cli.

The `context.log` method lets you log a string and a list of host values. 

The arguments must be passed in a Vector containing host values. You can read more details about host values in [CAP-46](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0046-01.md#host-value-type). The SDK can encode and decode host values.

The SDK offers following `wrapped` functions for logging:

```typescript
export function logStr(msg: string): void
export function logValue(value: Val): void
export function logMgsAndValue(msg: string, value: Val): void
export function log(msg: string, vals: Vec): void
export function logFromLinearMemory(msgPos: u32, msgLen: u32, valsPos: u32, valsLen: u32): void
```

The directly exposed host function via [env.js](https://github.com/Soneso/as-soroban-sdk/blob/main/lib/env.ts) is:

```typescript
export declare function log_from_linear_memory(msg_pos: U32Val, msg_len: U32Val, vals_pos: U32Val, vals_len: U32Val): VoidVal;
```

The `wrapped` SDK functions (except `logFromLinearMemory`) first write the data to be logged into the linear memory starting at position 0 and then call the host function `log_from_linear_memory`. If you have any data there and you do not want it to be overridden, consider using the wrapped function `logFromLinearMemory` or the directly exposed host function `log_from_linear_memory`. To do so, you first have to write your data into the linear memory starting at a certan position and the log it from there. As an example, let's have a look to the implementation of the `wrapped` `context.log` function of the SDK:

```typescript
export function log(msg: string, vals: Vec): void {
    // Copy message to linear memory
    let msgBytes = Bytes.fromString(msg);
    let msgLen = msgBytes.len();
    msgBytes.copyToLinearMemory(0, 0, msgLen); // starts at position 0

    // Copy vals to linear memory
    let valsLen = fromU32(vals.len())
    let valsPos = fromU32(msgLen + 1)
    vec_unpack_to_linear_memory(vals.getHostObject(), valsPos, valsLen);

    // Log from linear memory
    log_from_linear_memory(fromU32(0), fromU32(msgLen), valsPos, valsLen);
}
```
