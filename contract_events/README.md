# Events

The [events example](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events) demonstrates how to publish events from a contract. This example is an extension of the [storing data example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract, you must first install the official [stellar-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked stellar-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd contract_events
npm install
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Deploy:

```sh
stellar contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

This returns the ID of the contract, starting with a C. 

E.g. `CC6CTPUBTGYTZBKDVBQWFQTFNLPVBXXTE2TLK4TGKF6BY3SXZFPIMNMG`

Before we invoke the contract, let's first get the latest ledger sequence number. We will need it to fetch the events after invoking the contract:

```sh
curl -X POST \
    -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":"1234","method":"getLatestLedger"}' \
    https://soroban-testnet.stellar.org/
```

The output should be something like this:

```sh
{"jsonrpc":"2.0","id":"1234","result":{"id":"d0259543bb1d711c3e55f9237b56f4254b70d06117071fc0139aad30acbc95c0","protocolVersion":21,"sequence":116837}}
```
In the upper result, the latest ledger sequence number is `116837`.

Next let's invoke:

```sh
stellar contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id <your contract id here> \
  -- increment
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
Event 0000501871223525376-0000000001 [CONTRACT]:
  Ledger:   116851 (closed at 2024-06-18T23:28:52Z)
  Contract: CC2ZULT6IXUWB4JP46GZCOZD32MIGKV5KXS5WQZLC2Y2BP3PIVLB7ABM
  Topics:
            Symbol(ScSymbol(StringM(COUNTER)))
            Symbol(ScSymbol(StringM(increment)))
  Value: U32(1)
Event 0000501871223525376-0000000002 [DIAGNOSTIC]:
  Ledger:   116851 (closed at 2024-06-18T23:28:52Z)
  Contract: CC2ZULT6IXUWB4JP46GZCOZD32MIGKV5KXS5WQZLC2Y2BP3PIVLB7ABM
  Topics:
            Symbol(ScSymbol(StringM(fn_return)))
            Symbol(ScSymbol(StringM(increment)))
  Value: U32(1)
Latest Ledger: 116853
```

## Code

You can find the code in:

```sh
contract_events/assembly/index.ts
```

```typescript
import {U32Val, fromU32, fromSmallSymbolStr, toU32, storageTypePersistent} from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import {Vec} from 'as-soroban-sdk/lib/vec';
import * as context from "as-soroban-sdk/lib/context";

/// Increment increments an internal counter, and returns the value.
export function increment(): U32Val {

  let key = fromSmallSymbolStr("COUNTER");
  let counter:u32 = 0;

  // Get the current count.
  if (ledger.hasData(key, storageTypePersistent)) {
    let dataObj = ledger.getData(key, storageTypePersistent);
    counter = toU32(dataObj);
  }

  // Increment the count.
  counter += 1;
  
  // Save the count.
  let counterHostValue = fromU32(counter);
  ledger.putData(key, counterHostValue, storageTypePersistent);

  // Publish an event about the increment occuring.
  // The event has two topics:
  //   - The "COUNTER" symbol.
  //   - The "increment" symbol.
  // The event data is the count.
  let topics = new Vec();
  topics.pushBack(key);
  topics.pushBack(fromSmallSymbolStr("increment"));
  context.publishEvent(topics, counterHostValue);

  // Return the count to the caller.
  return counterHostValue;
}
```

## How it works

This example contract extends the [increment example](https://github.com/Soneso/as-soroban-examples/tree/main/increment) by publishing an event each time the counter is incremented.

Contract events let contracts emit information about what the contract is doing.

Contracts can publish events using the SDK's ```context.publishEvent``` or ```context.publishSimpleEvent``` wrapped function.

```typescript
context.publishEvent(topics, data)
``` 

Alternatively the direct host function ```env.contract_event``` exposed by the SDK via [env.ts](https://github.com/Soneso/as-soroban-sdk/blob/main/lib/env.ts) can be used.

### Event Topics

An event may contain up to four topics.

Topics are defined using a vector. In the sample code two topics of type symbol are used.

```typescript
  // Publish an event about the increment occuring.
  // The event has two topics:
  //   - The "COUNTER" symbol.
  //   - The "increment" symbol.
  // The event data is the count.
  let topics = new Vec();
  topics.pushBack(key);
  topics.pushBack(fromSmallSymbolStr("increment"));
  context.publishEvent(topics, ...);
```

Tip: The topics don't have to be made of the same type. You can mix different types as long as the total topic count stays below the limit.

### Event Data

An event also contains a host value representing the data to be published.

```typescript
context.publishEvent(..., counterHostValue);
```

### Publishing

Publishing an event is done by calling the ```context.publishEvent``` and giving it the topics and data. The function returns nothing on success, and panics on failure. Possible failure reasons can include malformed inputs (e.g. topic count exceeds limit) and running over the resource budget. Once successfully published, the new event will be available to applications consuming the events.

Contracts can also use the ```context.publishSimpleEvent``` function which publishes an event with one symbol topic without the need to create the vector.

```context.publishSimpleEvent("Hey", fromU32(counter))```

Caution: Published events are discarded if a contract invocation fails due to a panic, budget exhaustion, or when the contract returns an error.
