# Storing Data

The [events exammple](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events) demonstrates how to publish events from a contract. This example is an extension of the [storing data example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract in the sandbox, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```shell
cargo install --locked soroban-cli
```

Then, to run the example, navigate it's directory install the sdk. Then build the contract:

```shell
cd contract_events
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated ```.wasm``` (WebAssembly) file in the ```build``` folder. You can also find the ```.wat``` file there (text format of the ```.wasm```).

Now you can run the example contract:

```shell
soroban invoke --wasm build/release.wasm --id 9 --fn events
```

You should see the output:
```shell
1
```

If you run the contract again, you should see the output:
```shell
2
```

## Code

You can find the code in:

```shell
contract_events/assembly/index.ts
```

```typescript
import {RawVal, fromU32, fromSymbolStr, toU32} from 'as-soroban-sdk/lib/value';
import * as ledger from "as-soroban-sdk/lib/ledger";
import {Vec} from 'as-soroban-sdk/lib/vec';
import {publishEvent} from 'as-soroban-sdk/lib/context';

export function events(): RawVal {

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
  topics.pushBack(fromSymbolStr(key)); // "COUNTER"
  topics.pushBack(fromSymbolStr("increment"));
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
  topics.pushBack(fromSymbolStr(key)); // "COUNTER"
  topics.pushBack(fromSymbolStr("increment"));

  publishEvent(topics, ...);
```

Tip: The topics don't have to be made of the same type. You can mix different types as long as the total topic count stays below the limit.

### Event Data

An event also contains a data object of any value or type including types defined by contracts. In the example the data is the u32 count.

```typescript
  publishEvent(..., fromU32(counter));
```

### Publishing

Publishing an event is done by calling the ```publishEvent``` and giving it the topics and data. The function returns nothing on success, and panics on failure. Possible failure reasons can include malformed inputs (e.g. topic count exceeds limit) and running over the resource budget. Once successfully published, the new event will be available to applications consuming the events.

Contracts can also use the ```publishSimpleEvent``` function wich publishes an event with one symbol topic without the need to create the vector.

```publishSimpleEvent("Hey", fromU32(counter))```

Caution: Published events are discarded if a contract invocation fails due to a panic, budget exhaustion, or when the contract returns an error.
