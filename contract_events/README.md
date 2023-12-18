# Events

The [events example](https://github.com/Soneso/as-soroban-examples/tree/main/contract_events) demonstrates how to publish events from a contract. This example is an extension of the [storing data example](https://github.com/Soneso/as-soroban-examples/tree/main/increment).


## Run the example

To run a contract, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked --version 20.0.2 soroban-cli
```

Then, to run the example, navigate it's directory and install the sdk. Then build the contract:

```sh
cd contract_events
npm install as-soroban-sdk
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Deploy:

```sh
soroban contract deploy \
  --wasm build/release.wasm \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

This returns the ID of the contract, starting with a C. Next let's invoke:

```sh
soroban contract invoke  \
  --source SAIPPNG3AGHSK2CLHIYQMVBPHISOOPT64MMW2PQGER47SDCN6C6XFWQM \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id CAIJF5TVBGXMNWZPPVQEOFY2GK67M6RR3XXBHW4BFGMJDLIEPPIVMGG3 \
  -- increment
```

You should see the output:
```sh
2023-12-13T18:47:17.587107Z  INFO soroban_cli::log::diagnostic_event: 0: DiagnosticEvent {
    in_successful_contract_call: true,
    event: ContractEvent {
        ext: V0,
        contract_id: Some(
            Hash(17a1166743b43e4cd08b21a710467978162f0e117c690f7b0de1cb8743d645f2),
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
                    1,
                ),
            },
        ),
    },
}
1
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
