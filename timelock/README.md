# Timelock

The [timelock example](https://github.com/Soneso/as-soroban-examples/tree/main/timelock) demonstrates how to write a timelock and implements a greatly simplified claimable balance similar to the [claimable balance](https://developers.stellar.org/docs/glossary/claimable-balance) feature available on Stellar. This example assumes the reader is familiar with the [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth) and with [Soroban token usage](https://soroban.stellar.org/docs/reference/interfaces/token-interface). See also [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token)

## Code

You can find the code in:

```sh
timelock/assembly/index.ts
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/timelock

## How it works
Open the `timelock/assembly/index.ts` file or see the code above to follow along.

To initialize the contract the function `deposit` has to be invoked. Here, an account deposits a given amount of tokens and defines the claimants that are allowed to claim it. It also defines the timelock kind (before or after a given timepoint) and the timepoint as an unix timestamp.

### Transfer the tokens to the contract address

To deposit the tokens, they are transferred to the contract's address.

```typescript
let contract_address = context.getCurrentContractAddress()
let transferArgs = new Vec();
transferArgs.pushBack(from);
transferArgs.pushBack(contract_address);
transferArgs.pushBack(amount);
contract.callContract(token, "transfer", transferArgs);
```

### Store claimable balance

Next the info about the claimable balance is stored in the ledger.

```typescript
let claimableBlance = new Vec();
claimableBlance.pushBack(token); // index 0
claimableBlance.pushBack(amount); // index 1
claimableBlance.pushBack(lock_kind); // index 2
claimableBlance.pushBack(timestamp); // index 3
claimableBlance.pushBack(claimants); // index 4
ledger.putDataFor(S_BALANCE, claimableBlance.getHostObject());
```

### Claiming

To claim the deposit, the `claim` function must be invoked by a claimant. The deposit can only be claimed if the claimant has authorized the call, the preconditions are fulfilled, and the claimant is allowed to claim the deposit.

To validate if the claimant has authorized the call, the contract uses the Soroban auth framework:

```typescript
// Make sure claimant has authorized this call, which ensures their identity.
address.requireAuth(claimant);
```

To validate the request, the contract loads the needed info about the claimable balance from storage and from the current ledger first:

```typescript
// Load the data from storage.
let claimableBalance = new Vec(ledger.getDataFor(S_BALANCE));
let lock_kind = claimableBalance.get(2);
let timestamp = claimableBalance.get(3);

if (isU64Small(timestamp)) { // get u64 value.
  timestamp = toU64Small(timestamp);
} else {
  timestamp = toU64(timestamp);
}

// Get the current ledger timestamp (u64 value).
let ledger_timestamp = context.getLedgerTimestamp();
```

and then checks the preconditions:

```typescript
// The 'timelock' part: check that provided time point is before/after
// the current ledger timestamp.
if (toU32(lock_kind) == 0) { // must claim before time point
  if (ledger_timestamp >= timestamp) {
    context.failWithErrorCode(ERR_CODES.TIME_PREDICATE_NOT_FULFILLED);
  }   
} else { // must claim after after time point
  if (ledger_timestamp <= timestamp) {
    context.failWithErrorCode(ERR_CODES.TIME_PREDICATE_NOT_FULFILLED);
  }
}
```

If the time preconditions are fulfilled, the contract next verifies if the claimant is allowed to claim the deposit:

```typescript
let claimantsVec = new Vec(claimableBalance.get(4));
let index = claimantsVec.getFirstIndexOf(claimant);
if (isVoid(index)) { // claimant not found in data list.
  context.failWithErrorCode(ERR_CODES.CLAIMANT_NOT_ALLOWED);
} else {
  claimant = claimantsVec.get(toU32(index));
}
```

If all preconditions are fulfilled and the claimant is allowed to claim the deposit, then the deposit is transferred to the claimant:

```typescript
let contract_address = context.getCurrentContractAddress()
let transferArgs = new Vec();
transferArgs.pushBack(contract_address);
transferArgs.pushBack(claimant);
transferArgs.pushBack(amount);
contract.callContract(token, "transfer", transferArgs);
```


## Build the contract

To run a contract, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli):

```sh
cargo install --locked --version 20.1.1 soroban-cli
```

Then, to build the contract, navigate it's directory install the sdk. Then build the contract:

```sh
cd timelock
npm install as-soroban-sdk
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

## Run the contract

To run the contract, you need to prepare the needed accounts and token first. You can find an example in [testContract.cjs](https://github.com/Soneso/as-soroban-examples/tree/main/timelock/testContract.cjs).

To run the test, you can execute it as follows:

```sh
node testContract.cjs
```


