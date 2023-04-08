# Timelock

The [timelock example](https://github.com/Soneso/as-soroban-examples/tree/main/timelock) demonstrates how to write a timelock and implements a greatly simplified claimable balance similar to the [claimable balance](https://developers.stellar.org/docs/glossary/claimable-balance) feature available on Stellar. This example assumes the reader is familiar with the [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth) and with [Soroban token usage](https://soroban.stellar.org/docs/reference/interfaces/token-interface). See also [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token)

## Code

You can find the code in:

```sh
timelock/assembly/index.ts
```

```typescript
import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import * as contract from "as-soroban-sdk/lib/contract";
import * as ledger from "as-soroban-sdk/lib/ledger";
import {AddressObject, BytesObject, I128Object, fromSmallSymbolStr, RawVal, fromVoid, VecObject, U64Object, fromU32, toU32, isVoid, isU64Small, fromU64, toU64Small} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";

// This contract demonstrates 'timelock' concept and implements a
// reatly simplified Claimable Balance (similar to
// https://developers.stellar.org/docs/glossary/claimable-balance).
// The contract allows to deposit some amount of token and allow another
// account(s) claim it before or after provided time point.
// For simplicity, the contract only supports invoker-based auth.

export const S_BALANCE = "Balance";
export const S_INIT = "Init";

enum ERR_CODES {
  ALREADY_INITIALIZED = 1,
  TOO_MANY_CLAIMANTS = 2,
  NO_BALANCE = 3,
  TIME_PREDICATE_NOT_FULFILLED = 4,
  CLAIMANT_NOT_ALLOWED = 5
}

/** 
 * Inititializes the contract by making a deposit. Traps if already initialized.
 * 
 * @param {AddressObject} from The address that deposits the given token amount.
 * @param {BytesObject} token The token to be deposited.
 * @param {I128Object} amount The amount of the token to be deposited.
 * @param {VecObject} claimants The list of claimants (AddressObject's) that are allowed to claim the deposit. Maximum number of claimants is 10.
 * @param {RawVal} lock_kind The timelock kind (u32). If the provided value is 0 the lock_kind is "before" otherwise "after".
 * @param {U64Object} timestamp The time point (u64) to apply the timelock for.
 * @returns {RawVal} void
 */
export function deposit(from: AddressObject, token: BytesObject, amount: I128Object, claimants: VecObject, 
  lock_kind: RawVal, timestamp: U64Object): RawVal {
    
    if (ledger.hasDataFor(S_INIT)) {
      context.failWithErrorCode(ERR_CODES.ALREADY_INITIALIZED);
    }

    let claimantsVec = new Vec(claimants);
    if (claimantsVec.len() > 10) {
      context.failWithErrorCode(ERR_CODES.TOO_MANY_CLAIMANTS);
    }

    // Make sure `from` address authorized the deposit call with all the arguments.
    address.requireAuth(from);

    // Transfer token from `from` to this contract address.
    let contract_address = context.getCurrentContractAddress()
    let xferArgs = new Vec();
    xferArgs.pushBack(from);
    xferArgs.pushBack(contract_address);
    xferArgs.pushBack(amount);
    contract.callContract(token, fromSmallSymbolStr("xfer"), xferArgs.getHostObject());

    // Store all the necessary info to allow one of the claimants to claim it.
    let claimableBlance = new Vec();
    claimableBlance.pushBack(token); // index 0
    claimableBlance.pushBack(amount); // index 1
    claimableBlance.pushBack(lock_kind); // index 2
    claimableBlance.pushBack(timestamp); // index 3
    claimableBlance.pushBack(claimants); // index 4
    ledger.putDataFor(S_BALANCE, claimableBlance.getHostObject());

    // Mark contract as initialized to prevent double-usage.
    // Note, that this is just one way to approach initialization - it may
    // be viable to allow one contract to manage several claimable balances.
    ledger.putDataFor(S_INIT, fromU32(1));

    return fromVoid()
}

/**
 * Claims the deposit. Traps if the deposit can not be claimed.
 * 
 * @param {AddressObject} claimant The claimant that claims the deposit. 
 * @returns {RawVal} void 
 */
export function claim(claimant: AddressObject): RawVal {
 
  // Make sure claimant has authorized this call, which ensures their identity.
  address.requireAuth(claimant);

 
  // Make sure the contract has already been initialized and not already claimed.
  if (!ledger.hasDataFor(S_BALANCE)) {
    context.failWithErrorCode(ERR_CODES.NO_BALANCE);
  }
 
  // Load the data from storage.
  let claimableBalance = new Vec(ledger.getDataFor(S_BALANCE));
  let lock_kind = claimableBalance.get(2);
  var timestamp = claimableBalance.get(3);
  if (isU64Small(timestamp)) { // if not obj => make obj so we can compare
    timestamp = fromU64(toU64Small(timestamp));
  }
  
  // Get the current ledger timestamp.
  var ledger_timestamp = context.getLedgerTimestamp()
  if (isU64Small(ledger_timestamp)) { // if not obj => make obj so we can compare
    ledger_timestamp = fromU64(toU64Small(ledger_timestamp));
  }

  // The 'timelock' part: check that provided time point is before/after
  // the current ledger timestamp.
  if (toU32(lock_kind) == 0) { // before
    if (context.compareObj(timestamp, ledger_timestamp) == 1) { // timestamp > ledger_timestamp
      context.failWithErrorCode(ERR_CODES.TIME_PREDICATE_NOT_FULFILLED);
    }   
  } else { // after
    if (context.compareObj(timestamp, ledger_timestamp) == -1) { // timestamp < ledger_timestamp
      context.failWithErrorCode(ERR_CODES.TIME_PREDICATE_NOT_FULFILLED);
    }
  }

  // Check if claimant is allowed to claim.
  let claimantsVec = new Vec(claimableBalance.get(4));
  let index = claimantsVec.getFirstIndexOf(claimant);
  if (isVoid(index)) { // claimant not found in data list.
    context.failWithErrorCode(ERR_CODES.CLAIMANT_NOT_ALLOWED);
  } else {
    claimant = claimantsVec.get(toU32(index));
  }

  // Transfer the stored amount of token to claimant after passing
  // all the checks.
  let token = claimableBalance.get(0);
  let amount = claimableBalance.get(1);
  let contract_address = context.getCurrentContractAddress()
  let xferArgs = new Vec();
  xferArgs.pushBack(contract_address);
  xferArgs.pushBack(claimant);
  xferArgs.pushBack(amount);
  contract.callContract(token, fromSmallSymbolStr("xfer"), xferArgs.getHostObject());
  
  // Remove the balance entry to prevent any further claims.
  ledger.delDataFor(S_BALANCE);

  return fromVoid()
  
}
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/logging

## How it works
Open the `timelock/assembly/index.ts` file or see the code above to follow along.

To initialize the contract the function `deposit` has to be invoked. Here, an account deposits a given amount of tokens and defines the claimants that are allowed to claim it. It also defines the timelock kind (before or after a given timepoint) and the timepoint as an unix timestamp.

### Transfer the tokens to the contract address

To deposit the tokens, they are transfered to the contract's address.

```typescript
let contract_address = context.getCurrentContractAddress()
let xferArgs = new Vec();
xferArgs.pushBack(from);
xferArgs.pushBack(contract_address);
xferArgs.pushBack(amount);
contract.callContract(token, fromSmallSymbolStr("xfer"), xferArgs.getHostObject());
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

To validate the request, the contract loads the needed info about the claimable balance from storage and and from the current ledger first:

```typescript
// Load the data from storage.
let claimableBalance = new Vec(ledger.getDataFor(S_BALANCE));
let lock_kind = claimableBalance.get(2);
var timestamp = claimableBalance.get(3);
if (isU64Small(timestamp)) { // if not obj => make obj so we can compare
  timestamp = fromU64(toU64Small(timestamp));
}
  
// Get the current ledger timestamp.
var ledger_timestamp = context.getLedgerTimestamp()
```

and then checks the preconditions:

```typescript
// The 'timelock' part: check that provided time point is before/after
// the current ledger timestamp.
if (toU32(lock_kind) == 0) { // before
  if (context.compareObj(timestamp, ledger_timestamp) == 1) { // timestamp > ledger_timestamp
    context.failWithErrorCode(ERR_CODES.TIME_PREDICATE_NOT_FULFILLED);
  }   
} else { // after
  if (context.compareObj(timestamp, ledger_timestamp) == -1) { // timestamp < ledger_timestamp
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
let xferArgs = new Vec();
xferArgs.pushBack(contract_address);
xferArgs.pushBack(claimant);
xferArgs.pushBack(amount);
contract.callContract(token, fromSmallSymbolStr("xfer"), xferArgs.getHostObject());
```


## Build the contract

To run a contract in the sandbox, you must first install the official soroban cli as described here: [stellar soroban cli](https://github.com/stellar/soroban-cli).

```sh
cargo install --locked --version 0.7.0 soroban-cli
```

Then, to build the contract, navigate it's directory install the sdk. Then build the contract:

```sh
cd timelock
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

## Run the contract

To run the contract, you need to prepare the needed accounts and token first. You can find an example in [testContract.cjs](https://github.com/Soneso/as-soroban-examples/tree/main/timelock/testContract.cjs).

To run the test you can execute it as follows:

```sh
node testContract.cjs
```


