import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import { ERR_CODE } from "./util";
import { RawVal, AddressObject, BytesObject, fromVoid, toU32, I128Val, fromBool, toBool, isU32, VoidVal, U32Val, fromU32} from "as-soroban-sdk/lib/value";
import { has_administrator, read_administrator, write_administrator } from "./admin";
import { read_decimal, read_name, read_symbol, write_decimal, write_name, write_symbol } from "./metadata";
import { read_allowance, spend_allowance, write_allowance } from "./allowance";
import { ev_burn, ev_claw, ev_approve, ev_mint, ev_s_admin, ev_s_auth, ev_trans } from "./event";
import { is_authorized, read_balance, receive_balance, spend_balance, write_authorization } from "./balance";
import { isNegative } from "as-soroban-sdk/lib/val128";
import { bump_current_contract_instance_and_code } from "as-soroban-sdk/lib/env";

const INSTANCE_BUMP_AMOUNT = 34560; // 2 days

export function initialize(admin: AddressObject, decimal: U32Val, name:BytesObject, symbol:BytesObject): VoidVal {
    if (has_administrator()) {
      context.failWithErrorCode(ERR_CODE.ALREADY_INITIALIZED);
    }

    write_administrator(admin);

    if (toU32(decimal) > 255) {
      context.failWithErrorCode(ERR_CODE.DECIMAL_MUST_FIT_IN_U8);
    }

    write_decimal(decimal);
    write_name(name);
    write_symbol(symbol);
    return fromVoid();
}

export function allowance(from: AddressObject, spender:AddressObject): I128Val {
  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);
  return read_allowance(from, spender).get(0);
}

export function approve(from: AddressObject, spender:AddressObject, amount: I128Val, expiration_ledger:U32Val): VoidVal {

  address.requireAuth(from);
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  write_allowance(from, spender, amount, expiration_ledger);
  ev_approve(from, spender, amount, expiration_ledger);

  return fromVoid();
}

export function balance(id: AddressObject) : I128Val {
  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);
  return read_balance(id);
}

export function spendable_balance(id: AddressObject) : I128Val {
  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);
  return read_balance(id);
}

export function authorized(id: AddressObject) : RawVal {
  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);
  return fromBool(is_authorized(id));
}

export function transfer(from: AddressObject, to: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(from);

  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  
  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  spend_balance(from, amount);
  receive_balance(to, amount);
  ev_trans(from, to, amount);
  return fromVoid();
}

export function transfer_from(spender: AddressObject, from: AddressObject, to: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(spender);
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  
  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  spend_allowance(from, spender, amount);
  spend_balance(from, amount);
  receive_balance(to, amount);
  ev_trans(from, to, amount);
  return fromVoid();
}

export function burn(from: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(from);
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  spend_balance(from, amount);
  ev_burn(from, amount);
  return fromVoid();
}

export function burn_from(spender: AddressObject, from: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(spender);
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  spend_allowance(from, spender, amount);
  spend_balance(from, amount);
  ev_burn(from, amount);
  return fromVoid();
}

export function clawback(from: AddressObject, amount:I128Val) : VoidVal {
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  let admin = read_administrator();
  address.requireAuth(admin);

  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  spend_balance(from, amount);
  ev_claw(admin, from, amount);
  return fromVoid();
}

export function set_authorized(id: AddressObject, authorize:RawVal) : VoidVal {
  let admin = read_administrator();
  address.requireAuth(admin);

  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  if (isBoolean(authorize)) {
    write_authorization(id, toBool(authorize));
  } else if (isU32(authorize)) {
    let auth = toU32(authorize) > 0 ? true : false;
    write_authorization(id, auth);
  } else {
    context.failWithErrorCode(ERR_CODE.INVALID_AUTHORIZE_VALUE_TYPE);
  }
  ev_s_auth(admin, id, authorize);
  return fromVoid();
}

export function mint(to: AddressObject, amount:I128Val) : VoidVal {

  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  let admin = read_administrator();
  address.requireAuth(admin);

  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  receive_balance(to, amount);
  ev_mint(admin, to, amount);
  return fromVoid();
}

export function set_admin(new_admin: AddressObject) : VoidVal {
  let admin = read_administrator();
  address.requireAuth(admin);

  let bump = fromU32(INSTANCE_BUMP_AMOUNT);
  bump_current_contract_instance_and_code(bump, bump);

  write_administrator(new_admin);
  ev_s_admin(admin, new_admin);
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