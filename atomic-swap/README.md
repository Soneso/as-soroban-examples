# Atomic Swap

The [atomic swap example](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap) swaps two tokens between two authorized parties atomically while following the limits they set.
This example demonstrates advanced usage of Soroban auth framework and assumes the reader is familiar with the [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth) and with [Soroban token usage](https://soroban.stellar.org/docs/reference/interfaces/token-interface). See also [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token)

## Code

You can find the code in:

```sh
atomic-swap/assembly/index.ts
```

```typescript
import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import * as contract from "as-soroban-sdk/lib/contract";
import {AddressObject, BytesObject, I128Object, fromSmallSymbolStr, RawVal, fromVoid, isI128Small, toI128Small, isI128, fromI128Pieces} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";
import { Sym } from "as-soroban-sdk/lib/sym";

enum SWAP_ERR_CODES {
  NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A = 1,
  NOT_ENOUGH_TOKEN_A_FOR_TOKEN_B = 2,
}

// Swap token A for token B atomically. Settle for the minimum requested price
// for each party (this is an arbitrary choice to demonstrate the usage of
// allowance; full amounts could be swapped as well).

/**
 * Swaps token A for token B atomically.
 * @param {AddressObject} a The Address holding token a.
 * @param {AddressObject} b The Address holding token b.
 * @param {BytesObject} token_a The contract id representing token a.
 * @param {BytesObject} token_b The contract id representing token b.
 * @param {I128Object} amount_a The amount of token a offered.
 * @param {I128Object} min_b_for_a The min amount of token b requested for the amount of token a offered.
 * @param {I128Object} amount_b The amount of token b offered.
 * @param {I128Object} min_a_for_b The min amount of token a requested for the amount of token b offered.
 * @returns {RawVal} void. Traps on error.
 */
export function swap(a: AddressObject, b: AddressObject, 
  token_a: BytesObject, token_b: BytesObject, 
  amount_a: I128Object, min_b_for_a: I128Object, 
  amount_b: I128Object, min_a_for_b: I128Object): RawVal {
  

  // Verify preconditions on the minimum price for both parties.
  if (compareAmounts(amount_b, min_b_for_a) == -1) { // amount_b < min_b_for_a 
    context.failWithErrorCode(SWAP_ERR_CODES.NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A);
  }

  if (compareAmounts(amount_a, min_a_for_b) == -1) { // amount_a < min_a_for_b 
    context.failWithErrorCode(SWAP_ERR_CODES.NOT_ENOUGH_TOKEN_B_FOR_TOKEN_A);
  }

  // Require authorization for a subset of arguments specific to a party.
  // Notice, that arguments are symmetric - there is no difference between
  // `a` and `b` in the call and hence their signatures can be used
  // either for `a` or for `b` role.

  let argsA = new Vec();
  argsA.pushBack(token_a);
  argsA.pushBack(token_b);
  argsA.pushBack(amount_a);
  argsA.pushBack(min_b_for_a);

  address.requireAuthForArgs(a, argsA);

  let argsB = new Vec();
  argsB.pushBack(token_b);
  argsB.pushBack(token_a);
  argsB.pushBack(amount_b);
  argsB.pushBack(min_a_for_b);

  address.requireAuthForArgs(b, argsB);
 
  // Perform the swap via two token transfers.
  move_token(token_a, a, b, amount_a, min_a_for_b);
  move_token(token_b, b, a, amount_b, min_b_for_a);
 
  return fromVoid();

}

function move_token(token: BytesObject, from: AddressObject, to:AddressObject, 
  approve_amount:I128Object, xfer_amount:I128Object): void {
  
  let contract_address =  context.getCurrentContractAddress();

  // This call needs to be authorized by `from` address. Since it increases
  // the allowance on behalf of the contract, `from` doesn't need to know `to`
  // at the signature time.

  let incrArgs = new Vec();
  incrArgs.pushBack(from);
  incrArgs.pushBack(contract_address);
  incrArgs.pushBack(approve_amount);
  let func = Sym.fromSymbolString("incr_allow").getHostObject(); // "incr_allow" has more than 9 chars.
  contract.callContract(token, func, incrArgs.getHostObject());

  let xferArgs = new Vec();
  xferArgs.pushBack(contract_address);
  xferArgs.pushBack(from);
  xferArgs.pushBack(to);
  xferArgs.pushBack(xfer_amount);
  contract.callContract(token, fromSmallSymbolStr("xfer_from"), xferArgs.getHostObject());

}

//..
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap/assembly/index.ts

## How it works

The example contract requires two Address-es to authorize their parts of the swap operation: one Address wants to sell a given amount of token A for token B at a given price and another Address wants to sell token B for token A at a given price. The contract swaps the tokens atomically, but only if the requested minimum price is respected for both parties.

Open the `atomic-swap/assembly/index.ts` file or see the code above to follow along.

## Swap authorization

```typescript
...
let argsA = new Vec();
argsA.pushBack(token_a);
argsA.pushBack(token_b);
argsA.pushBack(amount_a);
argsA.pushBack(min_b_for_a);

address.requireAuthForArgs(a, argsA);

let argsB = new Vec();
argsB.pushBack(token_b);
argsB.pushBack(token_a);
argsB.pushBack(amount_b);
argsB.pushBack(min_a_for_b);

address.requireAuthForArgs(b, argsB);
...
```

Authorization of swap function leverages `require_auth_for_args` Soroban host function. Both a and b need to authorize symmetric arguments: token they sell, token they buy, amount of token they sell, minimum amount of token they want to receive. This means that a and b can be freely exchanged in the invocation arguments (as long as the respective arguments are changed too).

## Moving the tokens

```typescript
...
move_token(token_a, a, b, amount_a, min_a_for_b);
move_token(token_b, b, a, amount_b, min_b_for_a);
...

function move_token(token: BytesObject, from: AddressObject, to:AddressObject, 
  approve_amount:I128Object, xfer_amount:I128Object): void {
  
  let contract_address =  context.getCurrentContractAddress();

  // This call needs to be authorized by `from` address. Since it increases
  // the allowance on behalf of the contract, `from` doesn't need to know `to`
  // at the signature time.

  let incrArgs = new Vec();
  incrArgs.pushBack(from);
  incrArgs.pushBack(contract_address);
  incrArgs.pushBack(approve_amount);
  let func = Sym.fromSymbolString("incr_allow").getHostObject(); // "incr_allow" has more than 9 chars.
  contract.callContract(token, func, incrArgs.getHostObject());

  let xferArgs = new Vec();
  xferArgs.pushBack(contract_address);
  xferArgs.pushBack(from);
  xferArgs.pushBack(to);
  xferArgs.pushBack(xfer_amount);
  contract.callContract(token, fromSmallSymbolStr("xfer_from"), xferArgs.getHostObject());

}
```
The swap itself is implemented via two token moves: from a to b and from b to a. The token move is implemented via allowance: the users don't need to know each other in order to perform the swap, and instead they authorize the swap contract to spend the necessary amount of token on their behalf via `incr_allow`. Soroban auth framework makes sure that the `incr_allow` signatures would have the proper context, and they won't be usable outside the swap contract invocation.

## Build the contract

To build the example, navigate it's directory install the sdk. Then build the contract:

```sh
cd atomic-swap
npm install as-soroban-sdk
asc assembly/index.ts --target release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

## Run the contract

To run the contract, you can execute the test provided in [testContract.cjs](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap/testContract.cjs):

```sh
node testContract.cjs
```

It will build and deploy the contract to futurenet and then execute the python script [swap_test.py](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap/swap_test.py) which prepares the data and then invokes the contract.
