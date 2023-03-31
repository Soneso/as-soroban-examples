import * as context from "as-soroban-sdk/lib/context";
import * as address from "as-soroban-sdk/lib/address";
import { ERR_CODE, add_amounts, isNeg, lt, sub_amounts } from "./util";
import { RawVal, AddressObject, BytesObject, fromVoid, toU32, Signed128BitIntObject, fromBool, toBool, isU32} from "as-soroban-sdk/lib/value";
import { check_admin, has_administrator, write_administrator } from "./admin";
import { read_decimal, read_name, read_symbol, write_decimal, write_name, write_symbol } from "./metadata";
import { read_allowance, spend_allowance, write_allowance } from "./allowance";
import { ev_burn, ev_claw, ev_d_allow, ev_i_allow, ev_mint, ev_s_admin, ev_s_auth, ev_trans } from "./event";
import { is_authorized, read_balance, receive_balance, spend_balance, write_authorization } from "./balance";

export function initialize(admin: AddressObject, decimal: RawVal, name:BytesObject, symbol:BytesObject): RawVal {
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

export function allowance(from: AddressObject, spender:AddressObject): Signed128BitIntObject {
  return read_allowance(from, spender);
}

export function incr_allow(from: AddressObject, spender:AddressObject, amount: Signed128BitIntObject): RawVal {

  address.requireAuth(from);
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  let allowance = read_allowance(from, spender);
  write_allowance(from, spender, add_amounts(allowance, amount));
  ev_i_allow(from, spender, amount);
  return fromVoid();
}

export function decr_allow(from: AddressObject, spender:AddressObject, amount: Signed128BitIntObject): RawVal {

  address.requireAuth(from);
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  let allowance = read_allowance(from, spender);

  if (lt(allowance, amount)) {
    context.failWithErrorCode(ERR_CODE.INSUFFICIENT_ALLOWANCE);
  }
  
  write_allowance(from, spender, sub_amounts(allowance, amount));
  ev_d_allow(from, spender, amount);
  return fromVoid();
}

export function balance(id: AddressObject) : Signed128BitIntObject {
  return read_balance(id);
}

export function spendable(id: AddressObject) : Signed128BitIntObject {
  return read_balance(id);
}

export function authorized(id: AddressObject) : RawVal {
  return fromBool(is_authorized(id));
}

export function xfer(from: AddressObject, to: AddressObject, amount:Signed128BitIntObject) : RawVal {
  address.requireAuth(from);
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  spend_balance(from, amount);
  receive_balance(to, amount);
  ev_trans(from, to, amount);
  return fromVoid();
}

export function xfer_from(spender: AddressObject, from: AddressObject, to: AddressObject, amount:Signed128BitIntObject) : RawVal {
  address.requireAuth(spender);
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  spend_allowance(from, spender, amount);
  spend_balance(from, amount);
  receive_balance(to, amount);
  ev_trans(from, to, amount);
  return fromVoid();
}

export function burn(from: AddressObject, amount:Signed128BitIntObject) : RawVal {
  address.requireAuth(from);
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }

  spend_balance(from, amount);
  ev_burn(from, amount);
  return fromVoid();
}

export function burn_from(spender: AddressObject, from: AddressObject, amount:Signed128BitIntObject) : RawVal {
  address.requireAuth(spender);
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  spend_allowance(from, spender, amount);
  spend_balance(from, amount);
  ev_burn(from, amount);
  return fromVoid();
}

export function clawback(admin: AddressObject, from: AddressObject, amount:Signed128BitIntObject) : RawVal {
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  check_admin(admin);
  address.requireAuth(admin);
  spend_balance(from, amount);
  ev_claw(admin, from, amount);
  return fromVoid();
}

export function set_auth(admin: AddressObject, id: AddressObject, authorize:RawVal) : RawVal {
  check_admin(admin);
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

export function mint(admin: AddressObject, to: AddressObject, amount:Signed128BitIntObject) : RawVal {
  if (isNeg(amount)){
    context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
  }
  check_admin(admin);
  address.requireAuth(admin);
  receive_balance(to, amount);
  ev_mint(admin, to, amount);
  return fromVoid();
}

export function set_admin(admin: AddressObject, new_admin: AddressObject) : RawVal {
  check_admin(admin);
  address.requireAuth(admin);
  write_administrator(new_admin);
  ev_s_admin(admin, new_admin);
  return fromVoid();
}

export function decimals() : RawVal {
  return read_decimal();
}

export function name() : BytesObject {
  return read_name();
}

export function symbol() : BytesObject {
  return read_symbol();
}