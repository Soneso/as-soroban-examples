# Upgrading Contracts

The [upgradeable contract example](https://github.com/Soneso/as-soroban-examples/tree/main/upgradable_contract) demonstrates how to upgrade a Wasm contract.


## Code

The example contains both an "old" and "new" contract, where we upgrade from "old" to "new". The code below is for the "old" contract.


```typescript
import * as env from "as-soroban-sdk/lib/env";
import * as address from "as-soroban-sdk/lib/address";
import { AddressObject, BytesObject, fromVoid, VoidVal, 
U32Val, fromU32, storageTypeInstance} from "as-soroban-sdk/lib/value";
import * as ledger from "as-soroban-sdk/lib/ledger";

export function init(admin: AddressObject): VoidVal {
    ledger.putDataFor("admin", admin, storageTypeInstance);
    return fromVoid();
}

export function version(): U32Val {
  return fromU32(1);
}

export function upgrade(new_wasm_hash: BytesObject): VoidVal {
  let admin = ledger.getDataFor("admin", storageTypeInstance);
  address.requireAuth(admin);

  return env.update_current_contract_wasm(new_wasm_hash);
}
```

## How it works

The upgrade is only possible because the contract calls `env.update_current_contract_wasm`, with the wasm hash of the new contract as a parameter. The contract ID does not change. Note that the contract required authorization from an admin before upgrading. This is to prevent anyone from upgrading the contract.

```typescript
export function upgrade(new_wasm_hash: BytesObject): VoidVal {
  let admin = ledger.getDataFor("admin", storageTypeInstance);
  address.requireAuth(admin);

  return env.update_current_contract_wasm(new_wasm_hash);
}
```

The `update_current_contract_wasm` host function will also emit a `SYSTEM` contract [event](https://soroban.stellar.org/docs/fundamentals-and-concepts/events#event-types) that contains the old and new wasm reference, allowing downstream users to be notified when a contract they use is updated. The event structure will have `topics = ["executable_update", old_executable: ContractExecutable, old_executable: ContractExecutable]` and `data = []`.


## Run the example

To run a contract, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked --version 20.0.2 soroban-cli
```

Then, to run the example, navigate it's directory, install the sdk in both folders (old and new) and build the contracts:

```sh
cd upgradable_contract/old_contract
npm install as-soroban-sdk
npm run asbuild:release

cd ../new_contract
npm install as-soroban-sdk
npm run asbuild:release
```

Navigate back to the main folder:

```sh
cd ..
```

Since we are dealing with authorization, we need to set up an admin identity to use for testing:

```sh
soroban config identity generate admin && \
soroban config identity address admin
```

Example output with the account id of the admin:
```sh
GB4MIMLQLJAGMNB27AF57PYICGW3GVUYLON6SCTPU5AVWXUJXQH576BD
```

The admin account needs to be funded:
```sh
curl https://friendbot-futurenet.stellar.org?addr=<your admin account id here>
```

Now lets deploy the "old" contract first:
```sh
soroban contract deploy \
  --wasm old_contract/build/release.wasm \
  --source admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022"
```

Example output with the address of the deployed contract:
```sh
CBFXONN6XYZXKV6NSYFZXL4FNWJR2WQRPWF3NIWKLNY5FMO546OAXNHL
```

Next initialize the old contract:
```sh
soroban -q contract invoke  \
  --source admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022" \
  --id <your contract id here> \
  -- init \
  --admin <your admin account id here>
```

Let's invoke the `version` function:
```sh
soroban -q contract invoke  \
  --source admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022" \
  --id <your contract id here> \
  -- version
```

The output should be:
`1`

Next we install the `new` contract:

```sh
soroban contract install \
  --wasm new_contract/build/release.wasm \
  --source admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022"
```

Example output with the wasm hash of the new wasm executable:
```sh
8046195a05a169481188be51e14f0356d996e2814722d45663b1a2d4e27eb10d
```

Now we can upgrade our old contract. Notice the `--source` must be the identity name matching the address passed to the `init` function (admin).

```sh
soroban -q contract invoke  \
  --source admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022" \
  --id <id of the old contract here> \
  -- upgrade \
  --new_wasm_hash <wasm hash of the new contract here>
```


Let's invoke the `version` function again:
```sh
soroban -q contract invoke  \
  --source admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022" \
  --id <your contract id here> \
  -- version
```

Now that the contract was upgraded, you'll see a new version:
`2`

We can also invoke the new function added by the new contract:

```sh
soroban -q contract invoke  \
  --source admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022" \
  --id <your contract id here> \
  -- new_v2_fn
```

```sh
soroban -q contract invoke \
    --id CCVHPJIOXDVM7AJZNVQUTSIS3L465XV26INTENPE22R273PIKN6MANDZ \
    -- new_v2_fn
```

The output should be:
`19283`

