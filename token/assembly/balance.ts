import * as ledger from "as-soroban-sdk/lib/ledger";
import * as context from "as-soroban-sdk/lib/context";
import { AddressObject, fromI128Small, fromSmallSymbolStr, fromU32, I128Val, storageTypePersistent } from "as-soroban-sdk/lib/value";
import {Map} from "as-soroban-sdk/lib/map";
import { ERR_CODE, S_BALANCE } from "./util";
import { i128lt, i128sub, i128add } from "as-soroban-sdk/lib/val128";
import { extend_contract_data_ttl } from "as-soroban-sdk/lib/env";

const BALANCE_BUMP_AMOUNT = 518400; // 30 days
const BALANCE_LIFETIME_THRESHOLD = 501120 // 29 days

export function read_balance(addr: AddressObject): I128Val {

    let balanceKey = fromSmallSymbolStr(S_BALANCE);
    // S_BALANCE : map[addr, amount]
    if (ledger.hasData(balanceKey, storageTypePersistent)) {
        let balanceMap = new Map(ledger.getData(balanceKey, storageTypePersistent));
        if (balanceMap.has(addr)) {
            extend_contract_data_ttl(balanceKey, storageTypePersistent, 
                fromU32(BALANCE_LIFETIME_THRESHOLD),
                fromU32(BALANCE_BUMP_AMOUNT));
            return balanceMap.get(addr);
        }
    }

    return fromI128Small(0);
}

export function write_balance(addr: AddressObject, amount: I128Val): void {

    let balanceKey = fromSmallSymbolStr(S_BALANCE);
    let balanceMap = !ledger.hasData(balanceKey, storageTypePersistent) ? new Map() : new Map(ledger.getData(balanceKey, storageTypePersistent));
    balanceMap.put(addr,amount);
    ledger.putData(balanceKey, balanceMap.getHostObject(), storageTypePersistent);
    extend_contract_data_ttl(balanceKey, storageTypePersistent,
        fromU32(BALANCE_LIFETIME_THRESHOLD),
        fromU32(BALANCE_BUMP_AMOUNT));
}

export function receive_balance(addr: AddressObject, amount: I128Val): void {
    let balance = read_balance(addr);
    write_balance(addr, i128add(balance, amount));
}

export function spend_balance(addr: AddressObject, amount: I128Val): void {
    let balance = read_balance(addr);
    if (i128lt(balance, amount)) {
        context.failWithErrorCode(ERR_CODE.INSUFFICIENT_BALANCE);
    }
    write_balance(addr, i128sub(balance, amount));
}