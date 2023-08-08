import { BytesObject, I128Val, fromVoid, VoidVal, VecObject, 
  fromSmallSymbolStr, isI128Val, storageTypeInstance, 
  AddressObject} from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";
import { Map } from "as-soroban-sdk/lib/map";
import * as ledger from "as-soroban-sdk/lib/ledger";
import * as address from "as-soroban-sdk/lib/address";
import * as context from "as-soroban-sdk/lib/context";
import * as env from "as-soroban-sdk/lib/env";
import {i128gt, i128sub, isNegative} from "as-soroban-sdk/lib/val128";

//! This is a basic multi-sig account contract with a customizable per-token
//! authorization policy.
//!
//! This demonstrates how to build the account contracts and how to use the
//! authorization context in order to implement custom authorization policies
//! that would govern all the account contract interactions.

const OWNERS = "Owners";
const SPEND_LIMIT = "SpendMax";

enum ERR_CODE {
  NOT_INITIALIZED = 1,
  UNKNOWN_SIGNER = 2,
  NOT_ENOUGH_SIGNERS = 3,
  NEGATIVE_AMOUNT = 4
}

// Initialize the contract with a list of ed25519 public key ('owners').
export function init(owners:VecObject): VoidVal {
  // In reality this would need some additional validation on owners
  // (deduplication etc.).
  ledger.putDataFor(OWNERS, owners, storageTypeInstance, fromVoid());
  return fromVoid();
}

// Adds a limit on any token transfers that aren't signed by every owner.
export function add_limit(token:AddressObject, limit: I128Val): VoidVal {
  if(!ledger.hasDataFor(OWNERS, storageTypeInstance)) {
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
  ledger.putDataFor(SPEND_LIMIT, map.getHostObject(), storageTypeInstance, fromVoid());

  return fromVoid();
}

// This is the 'entry point' of the account contract and every account
// contract has to implement it. `require_auth` calls for the Address of
// this contract will result in calling this `__check_auth` function with
// the appropriate arguments.
//
// This should return VoidVal if authentication and authorization checks have
// been passed and return an error (or panic) otherwise.
//
// `__check_auth` takes the payload that needed to be signed, arbitrarily
// typed signatures (`Signature` contract type here) and authorization
// context that contains all the invocations that this call tries to verify.
//
// `__check_auth` has to authenticate the signatures. It also may use
// `auth_context` to implement additional authorization policies (like token
// spend limits here).
//
// Soroban host guarantees that `__check_auth` is only being called during
// `require_auth` verification and hence this may mutate its own state
// without the need for additional authorization (for example, this could
// store per-time-period token spend limits instead of just enforcing the
// limit per contract call).
//
// Note, that `__check_auth` function shouldn't call `require_auth` on the
// contract's own address in order to avoid infinite recursion.
export function __check_auth(signature_payload:BytesObject, signatures: VecObject, auth_context:VecObject): VoidVal {
  let signaturesVec = new Vec(signatures);
  let ownersObj = ledger.getDataFor(OWNERS, storageTypeInstance);
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
    authenticate(ownersVec, public_key,signature,signature_payload);
  }

  // This is a map for tracking the token spend limits per token. This
  // makes sure that if e.g. multiple `transfer` calls are being authorized
  // for the same token we still respect the limit for the total
  // transferred amount (and not the 'per-call' limits).
  let spend_left_per_token = new Map();
  let all_signed = signers_count == ownersVec.len();
  let context_vec = new Vec(auth_context);
  let contract_address = context.getCurrentContractAddress();
  // Verify the authorization policy.
  for (let i:u32 = 0; i < context_vec.len(); i++) {
      verify_authorization_policy(context_vec.get(i), contract_address, all_signed, spend_left_per_token);
  }
  return fromVoid();
}

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
  env.verify_sig_ed25519(public_key, payload, signature);
}

function verify_authorization_policy(context_entry:VecObject, curr_contract_addr:AddressObject, all_signed:bool, spend_left_per_token: Map) : void {

    let contextVec = new Vec(context_entry); //["Contract", ContextMap]
    let ctxt = new Map(contextVec.get(1));
    let ctxt_keys = ctxt.keys(); // contract (address), fn_name (symbol/str), args (vec[val])
    var ctxt_caddr = fromVoid();
    var ctxt_fn_name = fromVoid();
    var ctxt_args = fromVoid();
    for (let i:u32 = 0; i < ctxt_keys.len(); i++) {
      let key = ctxt_keys.get(i);
      if (fromSmallSymbolStr("contract") == key) {
        ctxt_caddr = ctxt.get(key);
      } else if (fromSmallSymbolStr("fn_name") == key) {
        ctxt_fn_name = ctxt.get(key);
      } else if (fromSmallSymbolStr("args") == key) {
        ctxt_args = ctxt.get(key);
      }
    }

    // For the account control every signer must sign the invocation.
    if (context.compareObj(ctxt_caddr, curr_contract_addr) == 0) {
        if(!all_signed) {
          context.failWithErrorCode(ERR_CODE.NOT_ENOUGH_SIGNERS);
        }
    }

    // Otherwise, we're only interested in functions that spend tokens.
    if (ctxt_fn_name != fromSmallSymbolStr("approve") && ctxt_fn_name != fromSmallSymbolStr("transfer")) {
      return;
    }

    let spend_left = fromVoid();

    if (spend_left_per_token.has(curr_contract_addr)) {
      spend_left = spend_left_per_token.get(curr_contract_addr);
    } else if (ledger.hasDataFor(SPEND_LIMIT, storageTypeInstance)){
       let spend_limit_map = new Map(ledger.getDataFor(SPEND_LIMIT, storageTypeInstance));
       if (spend_limit_map.has(ctxt_caddr)) {
          spend_left = spend_limit_map.get(ctxt_caddr);
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
          spend_left_per_token.put(curr_contract_addr, i128sub(spend_left, spent));
        }
    }
}

