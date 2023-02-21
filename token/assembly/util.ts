import { Signed128BitIntObject, toI128Low64, toI128High64, fromI128Pieces } from "as-soroban-sdk/lib/value";


export const S_ALLOWANCE = "Allowance";
export const S_ADMIN = "Admin";
export const S_DECIMALS = "Decimals";
export const S_NAME = "Name";
export const S_SYMBOL = "Symbol";
export const S_BALANCE = "Balance";
export const S_AUTHORIZED = "Authorized";

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

export function add_amounts(a:Signed128BitIntObject, b:Signed128BitIntObject) : Signed128BitIntObject {

    let al = toI128Low64(a);
    let ah = toI128High64(a);
    let bl = toI128Low64(b);
    let bh = toI128High64(b);

    let lo = al + bl;
    let hi = ah + bh + u64(lo < bl);
    return fromI128Pieces(lo,hi);
}

export function sub_amounts(a:Signed128BitIntObject, b:Signed128BitIntObject) : Signed128BitIntObject {
    
    let al = toI128Low64(a);
    let ah = toI128High64(a);
    let bl = toI128Low64(b);
    let bh = toI128High64(b);

    let lo = al - bl;
    let hi = ah - bh - u64(lo > al);
    return fromI128Pieces(lo,hi);
}

// a < b ?
export function lt(a:Signed128BitIntObject, b:Signed128BitIntObject) : bool {
    let al = toI128Low64(a);
    let ah = toI128High64(a);
    let bl = toI128Low64(b);
    let bh = toI128High64(b);

    return ah == bh ? al < bl : ah < bh;
}

export function isNeg(v:Signed128BitIntObject) : bool {
    return lt(v, fromI128Pieces(0, 0));
}