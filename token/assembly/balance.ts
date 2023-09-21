import * as ledger from "as-soroban-sdk/lib/ledger";
import * as context from "as-soroban-sdk/lib/context";
import { AddressObject, fromI128Small, fromSmallSymbolStr, fromU32, fromVoid, I128Val, storageTypePersistent, toU32 } from "as-soroban-sdk/lib/value";
import {Map} from "as-soroban-sdk/lib/map";
import { ERR_CODE, S_AUTHORIZED, S_BALANCE } from "./util";
import { isNegative, i128lt, i128sub, i128add } from "as-soroban-sdk/lib/val128";
import { bump_contract_data } from "as-soroban-sdk/lib/env";

const BALANCE_BUMP_AMOUNT = 518400; // 30 days

export function read_balance(addr: AddressObject): I128Val {

    // S_BALANCE : map[addr, amount]
    if (ledger.hasDataFor(S_BALANCE, storageTypePersistent)) {
        let balanceMap = new Map(ledger.getDataFor(S_BALANCE, storageTypePersistent));
        if (balanceMap.has(addr)) {
            let bump = fromU32(BALANCE_BUMP_AMOUNT);
            bump_contract_data(fromSmallSymbolStr(S_BALANCE), storageTypePersistent, bump, bump);
            return balanceMap.get(addr);
        }
    }

    return fromI128Small(0);
}

export function write_balance(addr: AddressObject, amount: I128Val): void {

    if(isNegative(amount)) {
        context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
    }

    let bump = fromU32(BALANCE_BUMP_AMOUNT);

    // S_BALANCE : map[addr, amount]
    if (!ledger.hasDataFor(S_BALANCE, storageTypePersistent)) {
        let balanceMap = new Map();
        balanceMap.put(addr, amount);
        ledger.putDataFor(S_BALANCE, balanceMap.getHostObject(), storageTypePersistent);
        bump_contract_data(fromSmallSymbolStr(S_BALANCE), storageTypePersistent, bump, bump);
        return;
    }

    let balanceMap = new Map(ledger.getDataFor(S_BALANCE, storageTypePersistent));
    balanceMap.put(addr,amount);
    ledger.putDataFor(S_BALANCE, balanceMap.getHostObject(), storageTypePersistent);
    bump_contract_data(fromSmallSymbolStr(S_BALANCE), storageTypePersistent, bump, bump);
}

export function receive_balance(addr: AddressObject, amount: I128Val): void {
    if (!is_authorized(addr)) {
        context.failWithErrorCode(ERR_CODE.CANT_RECEIVE_WHEN_DEAUTHORIZED);
    }
    let balance = read_balance(addr);
    write_balance(addr, i128add(balance, amount));
}

export function spend_balance(addr: AddressObject, amount: I128Val): void {
    if (!is_authorized(addr)) {
        context.failWithErrorCode(ERR_CODE.CANT_SPEND_WHEN_DEAUTHORIZED);
    }
    let balance = read_balance(addr);
    if (i128lt(balance, amount)) {
        context.failWithErrorCode(ERR_CODE.INSUFFICIENT_BALANCE);
    }
    write_balance(addr, i128sub(balance, amount));
}

export function is_authorized(addr: AddressObject) : bool {

    // S_AUTHORIZED : map[addr, u32]
    if (!ledger.hasDataFor(S_AUTHORIZED, storageTypePersistent)) {
        return true;
    }
    let authMap = new Map(ledger.getDataFor(S_AUTHORIZED, storageTypePersistent));
    if (authMap.has(addr) && toU32(authMap.get(addr)) == 0) {
        return false;
    }
    return true;
}

export function write_authorization(addr: AddressObject, is_authorized: bool): void {

    let u32Auth = is_authorized ? fromU32(1) : fromU32(0);

    // S_AUTHORIZED : map[addr, u32]
    if (!ledger.hasDataFor(S_AUTHORIZED, storageTypePersistent)) {
        let authMap = new Map();
        authMap.put(addr, u32Auth);
        ledger.putDataFor(S_AUTHORIZED, authMap.getHostObject(), storageTypePersistent);
        return;
    }

    let authMap = new Map(ledger.getDataFor(S_AUTHORIZED, storageTypePersistent));
    authMap.put(addr, u32Auth);
    ledger.putDataFor(S_AUTHORIZED, authMap.getHostObject(), storageTypePersistent);
}