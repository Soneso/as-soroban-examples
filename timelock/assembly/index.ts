import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import * as contract from "as-soroban-sdk/lib/contract";
import * as ledger from "as-soroban-sdk/lib/ledger";
import {AddressObject, I128Val, fromSmallSymbolStr, 
  RawVal, fromVoid, VecObject, U64Object, fromU32, toU32, isVoid, 
  isU64Small, toU64Small, toU64, storageTypeInstance} from "as-soroban-sdk/lib/value";
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
 * @param {I128Val} amount The amount of the token to be deposited.
 * @param {VecObject} claimants The list of claimants (AddressObject's) that are allowed to claim the deposit. Maximum number of claimants is 10.
 * @param {RawVal} lock_kind The timelock kind (u32). If the provided value is 0 the lock_kind is "before" otherwise "after".
 * @param {U64Object} timestamp The time point (u64) to apply the timelock for.
 * @returns {RawVal} void
 */
export function deposit(from: AddressObject, token: AddressObject, amount: I128Val, claimants: VecObject, 
  lock_kind: RawVal, timestamp: U64Object): RawVal {
    
    if (ledger.hasDataFor(S_INIT, storageTypeInstance)) {
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
    let transferArgs = new Vec();
    transferArgs.pushBack(from);
    transferArgs.pushBack(contract_address);
    transferArgs.pushBack(amount);
    contract.callContract(token, fromSmallSymbolStr("transfer"), transferArgs.getHostObject());
    
    // Store all the necessary info to allow one of the claimants to claim it.
    let claimableBlance = new Vec();
    claimableBlance.pushBack(token); // index 0
    claimableBlance.pushBack(amount); // index 1
    claimableBlance.pushBack(lock_kind); // index 2
    claimableBlance.pushBack(timestamp); // index 3
    claimableBlance.pushBack(claimants); // index 4
    ledger.putDataFor(S_BALANCE, claimableBlance.getHostObject(), storageTypeInstance);

    // Mark contract as initialized to prevent double-usage.
    // Note, that this is just one way to approach initialization - it may
    // be viable to allow one contract to manage several claimable balances.
    ledger.putDataFor(S_INIT, fromU32(1), storageTypeInstance);
    
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
  if (!ledger.hasDataFor(S_BALANCE, storageTypeInstance)) {
    context.failWithErrorCode(ERR_CODES.NO_BALANCE);
  }
 
  // Load the data from storage.
  let claimableBalance = new Vec(ledger.getDataFor(S_BALANCE, storageTypeInstance));
  let lock_kind = claimableBalance.get(2);
  let timestamp = claimableBalance.get(3);
  
  if (isU64Small(timestamp)) { // get u64 value.
    timestamp = toU64Small(timestamp);
  } else {
    timestamp = toU64(timestamp);
  }

  // Get the current ledger timestamp (u64 value).
  let ledger_timestamp = context.getLedgerTimestamp();

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
  let transferArgs = new Vec();
  transferArgs.pushBack(contract_address);
  transferArgs.pushBack(claimant);
  transferArgs.pushBack(amount);
  contract.callContract(token, fromSmallSymbolStr("transfer"), transferArgs.getHostObject());
  
  // Remove the balance entry to prevent any further claims.
  ledger.delDataFor(S_BALANCE, storageTypeInstance);

  return fromVoid()
  
}