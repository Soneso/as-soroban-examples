import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import { ERR_CODE } from "./util";
import { AddressObject, BytesObject, fromVoid, toU32, I128Val, VoidVal, U32Val, fromU32} from "as-soroban-sdk/lib/value";
import { has_administrator, read_administrator, write_administrator } from "./admin";
import { read_decimal, read_name, read_symbol, write_metadata } from "./metadata";
import { read_allowance, spend_allowance, write_allowance } from "./allowance";
import { ev_burn, ev_approve, ev_mint, ev_s_admin, ev_trans } from "./events";
import { read_balance, receive_balance, spend_balance } from "./balance";
import { isNegative } from "as-soroban-sdk/lib/val128";
import { bump_current_contract_instance_and_code } from "as-soroban-sdk/lib/env";

const INSTANCE_BUMP_AMOUNT = 120960; // 7 days
const INSTANCE_LIFETIME_THRESHOLD = 103680 // 6 days

export function initialize(admin: AddressObject, decimal: U32Val, name:BytesObject, symbol:BytesObject): VoidVal {
    if (has_administrator()) {
      context.failWithErrorCode(ERR_CODE.ALREADY_INITIALIZED);
    }

    write_administrator(admin);

    if (toU32(decimal) > 255) {
      context.failWithErrorCode(ERR_CODE.DECIMAL_MUST_FIT_IN_U8);
    }
    write_metadata(decimal, name, symbol);
    return fromVoid();
}

export function mint(to: AddressObject, amount:I128Val) : VoidVal {

  checkNonNegative(amount);

  let admin = read_administrator();
  address.requireAuth(admin);

  bumpInstanceAndCode();

  receive_balance(to, amount);
  ev_mint(admin, to, amount);
  return fromVoid();
}

export function set_admin(new_admin: AddressObject) : VoidVal {
  let admin = read_administrator();
  address.requireAuth(admin);

  bumpInstanceAndCode();

  write_administrator(new_admin);
  ev_s_admin(admin, new_admin);
  return fromVoid();
}

function bumpInstanceAndCode(): void {
  bump_current_contract_instance_and_code(fromU32(INSTANCE_LIFETIME_THRESHOLD), fromU32(INSTANCE_BUMP_AMOUNT));
}

function checkNonNegative(amount:I128Val): void {
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
}

// TOKEN INTERFACE
// see: https://soroban.stellar.org/docs/reference/interfaces/token-interface

export function allowance(from: AddressObject, spender:AddressObject): I128Val {
  bumpInstanceAndCode();
  return read_allowance(from, spender).get(0);
}

export function approve(from: AddressObject, spender:AddressObject, amount: I128Val, expiration_ledger:U32Val): VoidVal {

  address.requireAuth(from);
  checkNonNegative(amount);

  bumpInstanceAndCode();

  write_allowance(from, spender, amount, expiration_ledger);
  ev_approve(from, spender, amount, expiration_ledger);

  return fromVoid();
}

export function balance(id: AddressObject) : I128Val {
  bumpInstanceAndCode();
  return read_balance(id);
}

export function spendable_balance(id: AddressObject) : I128Val {
  bumpInstanceAndCode();
  return read_balance(id);
}

export function transfer(from: AddressObject, to: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(from);

  checkNonNegative(amount);
  
  bumpInstanceAndCode();

  spend_balance(from, amount);
  receive_balance(to, amount);
  ev_trans(from, to, amount);
  return fromVoid();
}

export function transfer_from(spender: AddressObject, from: AddressObject, to: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(spender);

  checkNonNegative(amount);
  
  bumpInstanceAndCode();

  spend_allowance(from, spender, amount);
  spend_balance(from, amount);
  receive_balance(to, amount);
  ev_trans(from, to, amount);
  return fromVoid();
}

export function burn(from: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(from);
  
  checkNonNegative(amount);

  bumpInstanceAndCode();

  spend_balance(from, amount);
  ev_burn(from, amount);
  return fromVoid();
}

export function burn_from(spender: AddressObject, from: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(spender);

  checkNonNegative(amount);

  bumpInstanceAndCode();

  spend_allowance(from, spender, amount);
  spend_balance(from, amount);
  ev_burn(from, amount);
  return fromVoid();
}

export function decimals() : U32Val {
  return read_decimal();
}

export function name() : BytesObject {
  return read_name();
}

export function symbol() : BytesObject {
  return read_symbol();
}