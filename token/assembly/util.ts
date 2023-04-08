import { I128Object, toI128Low64, toI128High64, fromI128Pieces, RawVal, isI128, isI128Small, toI128Small } from "as-soroban-sdk/lib/value";
import * as context from "as-soroban-sdk/lib/context";

export const S_ALLOWANCE = "Allowance";
export const S_ADMIN = "Admin";
export const S_DECIMALS = "Decimals";
export const S_NAME = "Name";
export const S_SYMBOL = "Symbol";
export const S_BALANCE = "Balance";
export const S_AUTHORIZED = "Authorizd";

export enum ERR_CODE {
    NOT_AUTHORIZED_BY_ADMIN = 1,
    ALREADY_INITIALIZED = 2,
    DECIMAL_MUST_FIT_IN_U8 = 3,
    INSUFFICIENT_ALLOWANCE = 4,
    NEG_AMOUNT_NOT_ALLOWED = 5,
    CANT_RECEIVE_WHEN_DEAUTHORIZED = 6,
    CANT_SPEND_WHEN_DEAUTHORIZED = 7,
    INSUFFICIENT_BALANCE = 8,
    INVALID_AUTHORIZE_VALUE_TYPE = 9,
    AMOUNT_OVERFLOW = 10
}

// accepts I128Small or I128Object.
export function add_amounts(a:RawVal, b:RawVal) : I128Object {

    let aObj = amountToObj(a);
    let bObj = amountToObj(b);
    let al = toI128Low64(aObj);
    let ah = toI128High64(aObj);
    let bl = toI128Low64(bObj);
    let bh = toI128High64(bObj);

    let lo = al + bl;
    let hi = ah + bh + u64(lo < bl);
    return fromI128Pieces(lo,hi);
}

// accepts I128Small or I128Object.
export function sub_amounts(a:RawVal, b:RawVal) : I128Object {
    let aObj = amountToObj(a);
    let bObj = amountToObj(b);
    let al = toI128Low64(aObj);
    let ah = toI128High64(aObj);
    let bl = toI128Low64(bObj);
    let bh = toI128High64(bObj);

    let lo = al - bl;
    let hi = ah - bh - u64(lo > al);
    return fromI128Pieces(lo,hi);
}

// a < b ?
// accepts I128Small or I128Object.
export function lt(a:RawVal, b:RawVal) : bool {
    let aObj = amountToObj(a);
    let bObj = amountToObj(b);
    let al = toI128Low64(aObj);
    let ah = toI128High64(aObj);
    let bl = toI128Low64(bObj);
    let bh = toI128High64(bObj);
    
    return ah == bh ? al < bl : ah < bh;
}

export function isNeg(v:I128Object) : bool {
    return lt(v, fromI128Pieces(0, 0));
}

// accepts I128Small or I128Object.
// returns I128Object.
// this is used to simplify this example contract.
// in a real contract you should handle them separately.
// TODO: add arithmetic operatios to the SDK
export function amountToObj(amount: RawVal) : I128Object {
    if (!isI128(amount) && !isI128Small(amount)) {
        context.fail();
    }
    if (isI128(amount)) {
        return amount;
    } else {
        return fromI128Pieces(toI128Small(amount), 0);
    }
}