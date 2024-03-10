# Token Example

The [token example](https://github.com/Soneso/as-soroban-examples/tree/main/token) demonstrates how to write a token contract that implements the Stellar [Token Interface](https://soroban.stellar.org/docs/reference/interfaces/token-interface).

## Run the example

To run a contract, you must first install the official [soroban-cli](https://soroban.stellar.org/docs/getting-started/setup):

```sh
cargo install --locked soroban-cli
```

Then, to run the example, navigate it's directory, install the sdk and build the contract:

```sh
cd token
npm install
npm run asbuild:release
```

You can find the generated `.wasm` (WebAssembly) file in the ```build``` folder. You can also find the `.wat` file there (text format of the `.wasm`).

Run the test:

```sh
node testContract.cjs
```

## Code
You can find the code in the [token directory](https://github.com/Soneso/as-soroban-examples/tree/main/token).

Entry point is [contract.ts](https://github.com/Soneso/as-soroban-examples/tree/main/token/assembly/contract.ts).

## How it works

Tokens access created on a smart contract platform can take many different forms, include a variety of different functionalities, and meet very different needs or use-cases. While each token can fulfill a unique niche, there are some "normal" features that almost all to tokens will need to make use of (e.g., payments, transfers, balance queries, etc.). In an effort to minimize repetition and streamline token deployments, Soroban implements the [Token Interface](https://soroban.stellar.org/docs/reference/interfaces/token-interface), which provides a uniform, predictable interface for developers and users.

Creating a Soroban token from an existing Stellar asset is very easy, and the wrapped token makes use of the [Stellar Asset Contract](https://soroban.stellar.org/docs/advanced-tutorials/stellar-asset-contract) (more on that later). This example contract, demonstrates how a smart contract token might be constructed that doesn't take advantage of the Stellar Asset Contract, but does still satisfy the commonly used Token Interface to maximize interoperability.

### Separation of Functionality

You have likely noticed that this example contract is broken into discrete modules, with each one responsible for a siloed set of functionality. This common practice helps to organize the code and make it more maintainable.

For example, most of the token logic exists in the `contract.ts` module. Functions like mint, burn, transfer, etc. are written and programmed in that finanacial file. The [Token Interface](https://soroban.stellar.org/docs/reference/interfaces/token-interface) describes how some of these functions should emit events when they occur. However, keeping all that event-emitting logic bundled in with the rest of the contract code could make it harder to track what is happening in the code, and that system confusion could ultimately lead to errors.

Instead, we have a separate `events.ts` module that takes away all the headache of emitting events when other functions run. Here is the function to emit an event whenever the token is minted:

```typescript
export function ev_mint(admin: AddressObject, to:AddressObject, amount: I128Val): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("mint"));
    topics.pushBack(admin);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}
```

Admittedly, this is a simple example, but constructing the contract this way makes it very clear to the developer what is happening and where. This function is then used by the `contract.ts` module whenever the `ev_mint` function is invoked:

```typescript

export function mint(to: AddressObject, amount:I128Val) : VoidVal {
  checkNonNegative(amount);
  let admin = read_administrator();
  address.requireAuth(admin);
  bumpInstanceAndCode();
  receive_balance(to, amount);
  ev_mint(admin, to, amount); // publish mint event
  return fromVoid();
}
```

This same convention is used to separate from the "main" contract code the metadata for the token, the storage type definitions, etc.

### Standardized Interface, Customized Behavior

This example contract follows the standardized [Token Interface](https://soroban.stellar.org/docs/reference/interfaces/token-interface), implementing all of the same functions as the [Stellar Asset Contract](https://soroban.stellar.org/docs/advanced-tutorials/stellar-asset-contract). This gives wallets, users, developers, etc. a predictable interface to interact with the token. Even though we are implementing the same *interface* of functions, that doesn't mean we have to implement the same *behavior* inside those functions. While this example contract doesn't actually modify any of the functions that would be present in a deployed instance of the Stellar Asset Contract, that possibility remains open to the contract developer.

By way of example, perhaps you have an NFT project, and the artist wants to have a small royalty paid every time their token transfers hands:

```typescript
export function transfer(from: AddressObject, to: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(from);
  checkNonNegative(amount);
  bumpInstanceAndCode();
  spend_balance(from, amount);

  // We calculate some new amounts for payment and royalty
  let payment = i128div(i128mul(amount, fromI128Small(997)), fromI128Small(1000));
  let royalty = i128sub(amount, payment);
  receive_balance(artist, royalty);
  receive_balance(to, payment);
  ev_trans(from, to, amount);
  return fromVoid();
}
```

The `transfer` interface is still in use, and is still the same as other tokens, but we've customized the behavior to address a specific need. Another use-case might be a tightly controlled token that requires authentication from an admin before any `transfer`, `allowance`, etc. function could be invoked.

### Compatibility with Stellar Assets

One of the key benefits of the Stellar network is that assets are first-class citizens. On a protocol level, asset issuers have a robust set of tools to manage the authorization and behavior of assets. Any asset that already exists on the Stellar network can also make use of the [Stellar Asset Contract](https://soroban.stellar.org/docs/advanced-tutorials/stellar-asset-contract) on the Soroban platform. All that is required is a simple, one-time action of wrapping the asset to be deployed for Soroban.

At that point, the asset can use all the features of the Stellar Asset Contract that are highlighted in this example (allowance, mint, burn, etc.), while still maintaining the high-quality asset issuer features included with Stellar.

Additionally, all of that comes with no contract writing required. Any asset can be easily wrapped using the [Soroban-CLI](https://soroban.stellar.org/docs/reference/soroban-cli):

```sh
soroban lab token wrap \
    --asset USDC:GCYEIQEWOCTTSA72VPZ6LYIZIK4W4KNGJR72UADIXUXG45VDFRVCQTYE
```

**Note:**

A Stellar asset could be wrapped for Soroban by any user. This command will set the asset issuer account as the `admin` address for the Soroban token, meaning that issuer account will still maintain control over asset minting, authorization, etc.
