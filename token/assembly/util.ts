export const S_ALLOWANCE = "Allowance";
export const S_ADMIN = "Admin";
export const S_DECIMALS = "Decimals";
export const S_NAME = "Name";
export const S_SYMBOL = "Symbol";
export const S_BALANCE = "Balance";

export enum ERR_CODE {
    ALREADY_INITIALIZED = 1,
    DECIMAL_MUST_FIT_IN_U8 = 2,
    INSUFFICIENT_ALLOWANCE = 3,
    NEG_AMOUNT_NOT_ALLOWED = 4,
    INSUFFICIENT_BALANCE = 5,
    EXP_LEG_LESS_SEQ_WHEN_AMOUNT_GT_0 = 6
}