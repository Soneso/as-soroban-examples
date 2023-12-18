# Atomic Swap

The [atomic swap example](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap) swaps two tokens between two authorized parties atomically while following the limits they set.
This example demonstrates advanced usage of Soroban auth framework and assumes the reader is familiar with the [auth example](https://github.com/Soneso/as-soroban-examples/tree/main/auth) and with [Soroban token usage](https://soroban.stellar.org/docs/reference/interfaces/token-interface). See also [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token)

## Code

You can find the code in:

```sh
atomic-swap/assembly/index.ts
```

Ref: https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap/assembly/index.ts

## How it works

The example contract requires two Address-es to authorize their parts of the swap operation: one Address wants to sell a given amount of token A for token B at a given price and another Address wants to sell token B for token A at a given price. The contract swaps the tokens atomically, but only if the requested minimum price is respected for both parties.

Open the `atomic-swap/assembly/index.ts` file or see the code above to follow along.

## Swap authorization

```typescript

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

```

Authorization of swap function leverages `require_auth_for_args` Soroban host function. Both a and b need to authorize symmetric arguments: token they sell, token they buy, amount of token they sell, minimum amount of token they want to receive. This means that a and b can be freely exchanged in the invocation arguments (as long as the respective arguments are changed too).

## Moving the tokens

```typescript
...
move_token(token_a, a, b, amount_a, min_a_for_b);
move_token(token_b, b, a, amount_b, min_b_for_a);
...

function move_token(token: AddressObject, from: AddressObject, to:AddressObject, 
  max_spend_amount:I128Val, transfer_amount:I128Val): void {
  
  let contract_address =  context.getCurrentContractAddress();

  // This call needs to be authorized by `from` address. It transfers the
  // maximum spend amount to the swap contract's address in order to decouple
  // the signature from `to` address (so that parties don't need to know each
  // other).

  let func = fromSmallSymbolStr("transfer");

  let t1Args = new Vec();
  t1Args.pushBack(from);
  t1Args.pushBack(contract_address);
  t1Args.pushBack(max_spend_amount);
  env.call(token, func, t1Args.getHostObject());

  // Transfer the necessary amount to `to`.
  let t2Args = new Vec();
  t2Args.pushBack(contract_address);
  t2Args.pushBack(to);
  t2Args.pushBack(transfer_amount);
  env.call(token, func, t2Args.getHostObject());

  // Refund the remaining balance to `from`.
  let t3Args = new Vec();
  t3Args.pushBack(contract_address);
  t3Args.pushBack(from);
  t3Args.pushBack(i128sub(max_spend_amount,transfer_amount));
  env.call(token, func, t3Args.getHostObject());
}
```

## Build the contract

To build the example, navigate it's directory install the sdk. Then build the contract:

```sh
cd atomic-swap
npm install as-soroban-sdk
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the `build` folder. You can also find the `.wat` file there (text format of the `.wasm`).

## Run the contract

To run the contract, you can execute the test provided in [testContract.cjs](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap/testContract.cjs):

```sh
node testContract.cjs
```

It will build and deploy the contract to futurenet and then execute the python script [swap_test.py](https://github.com/Soneso/as-soroban-examples/tree/main/atomic-swap/swap_test.py) which prepares the data and then invokes the contract.
