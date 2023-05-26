import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import { ERR_CODE } from "./util";
import { RawVal, AddressObject, BytesObject, fromVoid, toU32, I128Val, fromBool, toBool, isU32, VoidVal, U32Val} from "as-soroban-sdk/lib/value";
import { has_administrator, read_administrator, write_administrator } from "./admin";
import { read_decimal, read_name, read_symbol, write_decimal, write_name, write_symbol } from "./metadata";
import { read_allowance, spend_allowance, write_allowance } from "./allowance";
import { ev_burn, ev_claw, ev_d_allow, ev_i_allow, ev_mint, ev_s_admin, ev_s_auth, ev_trans } from "./event";
import { is_authorized, read_balance, receive_balance, spend_balance, write_authorization } from "./balance";
import { isNegative, i128lt, i128sub, i128add } from "as-soroban-sdk/lib/val128";

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
  return read_allowance(from, spender);
}

export function increase_allowance(from: AddressObject, spender:AddressObject, amount: I128Val): VoidVal {

  address.requireAuth(from);
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  let allowance = read_allowance(from, spender);
  write_allowance(from, spender, i128add(allowance, amount));
  ev_i_allow(from, spender, amount);
  return fromVoid();
}

export function decrease_allowance(from: AddressObject, spender:AddressObject, amount: I128Val): VoidVal {

  address.requireAuth(from);
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  let allowance = read_allowance(from, spender);

  if (i128lt(allowance, amount)) {
    context.failWithErrorCode(ERR_CODE.INSUFFICIENT_ALLOWANCE);
  }
  
  write_allowance(from, spender, i128sub(allowance, amount));
  ev_d_allow(from, spender, amount);
  return fromVoid();
}

export function balance(id: AddressObject) : I128Val {
  return read_balance(id);
}

export function spendable_balance(id: AddressObject) : I128Val {
  return read_balance(id);
}

export function authorized(id: AddressObject) : RawVal {
  return fromBool(is_authorized(id));
}

export function transfer(from: AddressObject, to: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(from);

  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

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

  spend_balance(from, amount);
  ev_burn(from, amount);
  return fromVoid();
}

export function burn_from(spender: AddressObject, from: AddressObject, amount:I128Val) : VoidVal {
  address.requireAuth(spender);
  if (isNegative(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
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
  spend_balance(from, amount);
  ev_claw(admin, from, amount);
  return fromVoid();
}

export function set_authorized(id: AddressObject, authorize:RawVal) : VoidVal {
  let admin = read_administrator();
  address.requireAuth(admin);
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
  receive_balance(to, amount);
  ev_mint(admin, to, amount);
  return fromVoid();
}

export function set_admin(new_admin: AddressObject) : VoidVal {
  let admin = read_administrator();
  address.requireAuth(admin);
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