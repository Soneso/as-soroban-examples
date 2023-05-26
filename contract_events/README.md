# Events

The [events example](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events) demonstrates how to publish events from a contract. This example is an extension of the [storing data example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract in the sandbox, you must first install the official `soroban cli` as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 0.8.0 soroban-cli
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
soroban contract invoke --wasm build/release.wasm --id 9 -- events
```

You should see the output:
```sh
1
```

The `soroban cli` logs events locally in the file .soroban/events.json. Look into that file to see the published event:

```sh
more .soroban/events.json 
```

You should see the output:
```json
{
  "events": [
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
  ],
  "latestLedger": 1
}
```

## Code

You can find the code in:

```sh
contract_events/assembly/index.ts
```

```typescript
import {U32Val, fromU32, fromSmallSymbolStr, toU32 } from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import {Vec} from 'as-soroban-sdk/lib/vec';
import {publishEvent} from 'as-soroban-sdk/lib/context';

export function events(): U32Val {

  let key = "COUNTER";
  var counter = 0;
  if (ledger.hasDataFor(key)) {
    let dataObj = ledger.getDataFor(key);
    counter = toU32(dataObj);
  }
  counter += 1;
  ledger.putDataFor(key, fromU32(counter));
  
  // prepare and publish event
  let topics = new Vec();
  topics.pushBack(fromSmallSymbolStr(key));
  topics.pushBack(fromSmallSymbolStr("increment"));
  publishEvent(topics, fromU32(counter));

  return ledger.getDataFor(key);
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/contract_events

## How it works

This example contract extends the increment example by publishing an event each time the counter is incremented.

Contract events let contracts emit information about what their contract is doing.

Contracts can publish events using the context ```publishEvent``` or ```publishSimpleEvent```  function.

```publishEvent(topics, data)``` 

### Event Topics

An event may contain up to four topics.

Topics are defined using a vector. In the sample code two topics of type symbol are used.

```typescript
  let topics = new Vec();
  topics.pushBack(fromSmallSymbolStr(key)); // "COUNTER"
  topics.pushBack(fromSmallSymbolStr("increment"));

  publishEvent(topics, ...);
```

Tip: The topics don't have to be made of the same type. You can mix different types as long as the total topic count stays below the limit.

### Event Data

An event also contains a data object of any value or type including types defined by contracts. In the example the data is the `u32` count.

```typescript
  publishEvent(..., fromU32(counter));
```

### Publishing

Publishing an event is done by calling the ```publishEvent``` and giving it the topics and data. The function returns nothing on success, and panics on failure. Possible failure reasons can include malformed inputs (e.g. topic count exceeds limit) and running over the resource budget. Once successfully published, the new event will be available to applications consuming the events.

Contracts can also use the ```publishSimpleEvent``` function wich publishes an event with one symbol topic without the need to create the vector.

```publishSimpleEvent("Hey", fromU32(counter))```

Caution: Published events are discarded if a contract invocation fails due to a panic, budget exhaustion, or when the contract returns an error.
