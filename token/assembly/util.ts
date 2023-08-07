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
    AMOUNT_OVERFLOW = 10,
    EXP_LEG_LESS_SEQ_WHEN_AMOUNT_GT_0 = 11
}