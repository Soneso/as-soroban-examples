# Custom Account

The [custom account example](https://github.com/Soneso/as-soroban-examples/tree/main/custom_account) demonstrates how to implement a simple account contract that supports multisig and customizable authorization policies. This account contract can be used with the Soroban auth framework, so that any time an `Address` pointing at this contract instance is used, the custom logic implemented here is applied.

Custom accounts are exclusive to Soroban and can't be used to perform other Stellar operations.

## Outdated

This example is outdated and needs to be updated to support soroban preview version 10. It currently supports soroban preview version 9.

**Danger**

Implementing a custom account contract requires a very good understanding of
authentication and authorization and requires rigorous testing and review. The
example here is *not* a full-fledged account contract - use it as an API
reference only.


**Caution**

Custom Accounts are still experimental and there is not much tooling built around them.

## How it Works

Open the `assembly/index.ts` file to follow along.

Account contracts implement a special function `__check_auth` that takes the
signature payload, signatures and authorization context. The function should
error if auth is declined, otherwise auth will be approved.

This example contract uses ed25519 keys for signature verification and supports
multiple equally weighted signers. It also implements a policy that allows
setting per-token limits on transfers. The token can be spent beyond the limit
only if every signature is provided.

For example, the user may initialize this contract with 2 keys and introduce 100
USDC spend limit. This way they can use a single key to sign their contract
invocations and be sure that even if they sign a malicious transaction they
won't spend more than 100 USDC.

### Initialization

```typescript
const OWNERS = "Owners";
const SPEND_LIMIT = "SpendMax";
...
// Initialize the contract with a list of ed25519 public key ('owners').
export function init(owners:VecObject): VoidVal {
  // In reality this would need some additional validation on owners
  // (deduplication etc.).
  ledger.putDataFor(OWNERS, owners);
  return fromVoid();
}
```

This account contract needs to work with the public keys explicitly. Here we
initialize the contract with ed25519 keys.

### Policy modification

```typescript
// Adds a limit on any token transfers that aren't signed by every owner.
export function add_limit(token:BytesObject, limit: I128Val): VoidVal {
  if(!ledger.hasDataFor(OWNERS)) {
    context.failWithErrorCode(ERR_CODE.NOT_INITIALIZED);
  }

  // The current contract address is the account contract address and has
  // the same semantics for `require_auth` call as any other account
  // contract address.
  // Note, that if a contract *invokes* another contract, then it would
  // authorize the call on its own behalf and that wouldn't require any
  // user-side verification.
  let contract_address = context.getCurrentContractAddress();
  address.requireAuth(contract_address);

  let map = new Map();
  map.put(token,limit);
  ledger.putDataFor(SPEND_LIMIT, map.getHostObject());

  return fromVoid();
}
```

This function allows users to set and modify the per-token spend limit described
above. The neat trick here is that `requireAuth` can be used for the 
current contract address, i.e. the account contract may be used to verify
authorization for its own administrative functions. This way there is no need
to write duplicate authorization and authentication logic.

### `__check_auth`

```typescript
export function __check_auth(signature_payload:BytesObject, signatures: VecObject, auth_context:VecObject): VoidVal {
  let signatureArgs = new Vec(signatures);
  let signaturesVec = new Vec(signatureArgs.get(0));

  let ownersObj = ledger.getDataFor(OWNERS);
  let ownersVec = new Vec(ownersObj);

  // Perform authentication.
  let signers_count:u32 = 0;
  for (signers_count = 0; signers_count < signaturesVec.len(); signers_count++) {
    let signature_map = new Map(signaturesVec.get(signers_count));
    let keys = signature_map.keys();
    let public_key = fromVoid();
    let signature = fromVoid();
    for (let i:u32 = 0; i < keys.len(); i++) {
      let key = keys.get(i);
      if (fromSmallSymbolStr("signature") == key) {
        signature = signature_map.get(key);
      } else {
        public_key = signature_map.get(key);
      }
    }
    authenticate(ownersVec, public_key, signature, signature_payload);
  }

  // This is a map for tracking the token spend limits per token. This
  // makes sure that if e.g. multiple `transfer` calls are being authorized
  // for the same token we still respect the limit for the total
  // transferred amount (and not the 'per-call' limits).
  let spend_left_per_token = new Map();
  let all_signed = signers_count == ownersVec.len();
  let context_vec = new Vec(auth_context);
  let contract_address = context.getCurrentContractAddress();
  let contract_id = address.address_to_contract_id(contract_address);
  // Verify the authorization policy.
  for (let i:u32 = 0; i < context_vec.len(); i++) {
      verify_authorization_policy(context_vec.get(i), contract_id, all_signed, spend_left_per_token);
  }
  return fromVoid();
}
```

`__check_auth` is a special function that account contracts implement. It will
be called by the Soroban environment every time `requireAuth` or
`requireAuthForArgs` is called for the address of the account contract.

Here it is implemented in two steps. First, authentication is performed using
the signature payload and a vector of signatures. Second, authorization policy
is enforced using the `auth_context` vector. This vector contains all the
contract calls that are being authorized by the provided signatures.

`__check_auth` is a reserved function and can only be called by the Soroban
environment in response to a call to `requireAuth`. Any direct call to
`__check_auth` will fail. This makes it safe to write to the account contract
storage from `__check_auth`, as it's guaranteed to not be called in unexpected
context. In this example it's possible to persist the spend limits without
worrying that they'll be exhausted via a bad actor calling `__check_auth`
directly.

### Authentication

```typescript
function authenticate(ownersVec: Vec, public_key:BytesObject, signature:BytesObject, payload:BytesObject): void {
  
  let hasSigner = false;
  for (let i:u32 = 0; i < ownersVec.len(); i++) {
    let owner = ownersVec.get(i);
    if (context.compareObj(owner, public_key) == 0) {
      hasSigner = true;
      break;
    }
  }
  if (!hasSigner) {
    context.failWithErrorCode(ERR_CODE.UNKNOWN_SIGNER);
  }
  crypto.verify_sig_ed25519(public_key, payload, signature);
}
```

Authentication here simply checks that the provided signatures are valid given
the payload and also that they belong to the owners of this account contract.

### Authorization policy
```typescript
function verify_authorization_policy(context_entry:MapObject, curr_contract_cid:BytesObject, all_signed:bool, spend_left_per_token: Map) : void {
    let ctxt = new Map(context_entry);
    let ctxt_keys = ctxt.keys(); // contract (bytes), fn_name (symbol/str), args (vec[val])
    let ctxt_cid = fromVoid();
    let ctxt_fn_name = fromVoid();
    let ctxt_args = fromVoid();
    for (let i:u32 = 0; i < ctxt_keys.len(); i++) {
      let key = ctxt_keys.get(i);
      if (fromSmallSymbolStr("contract") == key) {
        ctxt_cid = ctxt.get(key);
      } else if (fromSmallSymbolStr("fn_name") == key) {
        ctxt_fn_name = ctxt.get(key);
      } else if (fromSmallSymbolStr("args") == key) {
        ctxt_args = ctxt.get(key);
      }
    }

    // For the account control every signer must sign the invocation.
    if (context.compareObj(ctxt_cid, curr_contract_cid) == 0) {
        if(!all_signed) {
          context.failWithErrorCode(ERR_CODE.NOT_ENOUGH_SIGNERS);
        }
    }
```

We verify the policy per `context_entry`. i.e. Per one `requireAuth` call. The policy
for the account contract itself enforces every signer to have signed the method
call.

```typescript
    // Otherwise, we're only interested in functions that spend tokens.
    let incall_name = Sym.fromSymbolString("increase_allowance").getHostObject();
    if (ctxt_fn_name != fromSmallSymbolStr("transfer") && context.compareObj(ctxt_fn_name, incall_name) != 0) {
      return;
    }

    let spend_left = fromVoid();

    if (spend_left_per_token.has(curr_contract_cid)) {
      spend_left = spend_left_per_token.get(curr_contract_cid);
    } else if (ledger.hasDataFor(SPEND_LIMIT)){
       let spend_limit_map = new Map(ledger.getDataFor(SPEND_LIMIT));
       if (spend_limit_map.has(ctxt_cid)) {
          spend_left = spend_limit_map.get(ctxt_cid);
       }
    }

    // if it is still void, it means that the contract is outside of the policy.
    if (isI128Val(spend_left)) {
        // 'amount' is the third argument in both `approve` and `transfer`.
        // If the contract has a different signature, it's safer to panic
        // here, as it's expected to have the standard interface.
        let args_vec = new Vec(ctxt_args);
        let spent = args_vec.get(2);
        if(isNegative(spent)) {
          context.failWithErrorCode(ERR_CODE.NEGATIVE_AMOUNT);
        }
        if (!all_signed && (isNegative(spend_left) || i128gt(spent, spend_left))) {
          context.failWithErrorCode(ERR_CODE.NOT_ENOUGH_SIGNERS);
        }
        if (!isNegative(spend_left)) {
          spend_left_per_token.put(curr_contract_cid, i128sub(spend_left, spent));
        }
    }
}
```

Then we check for the standard token function names and verify that for these
function we don't exceed the spending limits.

### Test

A test can be found [here](https://github.com/Soneso/stellar-php-sdk/blob/main/Soneso/StellarSDKTests/SorobanCustomAccountTest.php).