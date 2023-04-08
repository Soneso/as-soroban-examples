import * as ledger from "as-soroban-sdk/lib/ledger";
import * as context from "as-soroban-sdk/lib/context";
import { AddressObject, fromI128Pieces, fromU32, I128Object, toU32 } from "as-soroban-sdk/lib/value";
import {Map} from "as-soroban-sdk/lib/map";
import { add_amounts, isNeg, lt, sub_amounts, ERR_CODE, S_AUTHORIZED, S_BALANCE } from "./util";

export function read_balance(addr: AddressObject): I128Object {

    // S_BALANCE : map[addr, amount]
    if (ledger.hasDataFor(S_BALANCE)) {
        let balanceMap = new Map(ledger.getDataFor(S_BALANCE));
        if (balanceMap.has(addr)) {
            return balanceMap.get(addr);
        }
    }

    return fromI128Pieces(0,0);
}

export function write_balance(addr: AddressObject, amount: I128Object): void {

    if(isNeg(amount)) {
        context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
    }

    // S_BALANCE : map[addr, amount]
    if (!ledger.hasDataFor(S_BALANCE)) {
        let balanceMap = new Map();
        balanceMap.put(addr, amount);
        ledger.putDataFor(S_BALANCE, balanceMap.getHostObject());
        return;
    }

    let balanceMap = new Map(ledger.getDataFor(S_BALANCE));
    balanceMap.put(addr,amount);
    ledger.putDataFor(S_BALANCE, balanceMap.getHostObject());
}

export function receive_balance(addr: AddressObject, amount: I128Object): void {
    if (!is_authorized(addr)) {
        context.failWithErrorCode(ERR_CODE.CANT_RECEIVE_WHEN_DEAUTHORIZED);
    }
    let balance = read_balance(addr);
    write_balance(addr, add_amounts(balance, amount));
}

export function spend_balance(addr: AddressObject, amount: I128Object): void {
    if (!is_authorized(addr)) {
        context.failWithErrorCode(ERR_CODE.CANT_SPEND_WHEN_DEAUTHORIZED);
    }
    let balance = read_balance(addr);
    if (lt(balance, amount)) {
        context.failWithErrorCode(ERR_CODE.INSUFFICIENT_BALANCE);
    }
    write_balance(addr, sub_amounts(balance, amount));
}

export function is_authorized(addr: AddressObject) : bool {

    // S_AUTHORIZED : map[addr, u32]
    if (!ledger.hasDataFor(S_AUTHORIZED)) {
        return true;
    }
    let authMap = new Map(ledger.getDataFor(S_AUTHORIZED));
    if (authMap.has(addr) && toU32(authMap.get(addr)) == 0) {
        return false;
    }
    return true;
}

export function write_authorization(addr: AddressObject, is_authorized: bool): void {

    let u32Auth = is_authorized ? fromU32(1) : fromU32(0);

    // S_AUTHORIZED : map[addr, u32]
    if (!ledger.hasDataFor(S_AUTHORIZED)) {
        let authMap = new Map();
        authMap.put(addr, u32Auth);
        ledger.putDataFor(S_AUTHORIZED, authMap.getHostObject());
        return;
    }

    let authMap = new Map(ledger.getDataFor(S_AUTHORIZED));
    authMap.put(addr, u32Auth);
    ledger.putDataFor(S_AUTHORIZED, authMap.getHostObject());
}