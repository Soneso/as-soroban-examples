# Events

The [events example](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events) demonstrates how to publish events from a contract. This example is an extension of the [storing data example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract in the sandbox, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli):

```sh
cargo install --locked --version 20.0.0-rc2 soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd contract_events
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Run the example contract:

```sh
soroban contract invoke --wasm build/release.wasm --id 9 -- increment
```

You should see the output:
```sh
// ...

2023-11-08T14:02:22.179585Z  INFO soroban_cli::log::host_event: 1: HostEvent {
    event: ContractEvent {
        ext: V0,
        contract_id: Some(
            Hash(0000000000000000000000000000000000000000000000000000000000000009),
        ),
        type_: Contract,
        body: V0(
            ContractEventV0 {
                topics: VecM(
                    [
                        Symbol(
                            ScSymbol(
                                StringM(COUNTER),
                            ),
                        ),
                        Symbol(
                            ScSymbol(
                                StringM(increment),
                            ),
                        ),
                    ],
                ),
                data: U32(
                    3,
                ),
            },
        ),
    },
    failed_call: false,
}

// ...
1
```

The `soroban cli` also logs events locally in the file .soroban/events.json. Look into that file to see the published event:

```sh
more .soroban/events.json 
```

You should be able to find this event:

```json

{
  "type": "contract",
  "ledger": "1",
  "ledgerClosedAt": "1970-01-01T00:00:05Z",
  "id": "0000000004294971393-0000000002",
  "pagingToken": "0000000004294971393-0000000002",
  "contractId": "0000000000000000000000000000000000000000000000000000000000000009",
  "topic": [
    "AAAADwAAAAdDT1VOVEVSAA==",
    "AAAADwAAAAlpbmNyZW1lbnQAAAA="
  ],
  "value": {
    "xdr": "AAAAAwAAAAE="
  }
}
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
