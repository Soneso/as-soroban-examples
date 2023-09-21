import * as ledger from "as-soroban-sdk/lib/ledger";
import * as context from "as-soroban-sdk/lib/context";
import {Map} from "as-soroban-sdk/lib/map";
import { AddressObject, fromI128Small, fromSmallSymbolStr, fromU32, I128Val, storageTypeTemporary, toU32, U32Val } from "as-soroban-sdk/lib/value";
import { isNegative, i128lt, i128sub, i128gt } from "as-soroban-sdk/lib/val128";
import { ERR_CODE, S_ALLOWANCE } from "./util";
import { Vec } from "as-soroban-sdk/lib/vec";
import { bump_contract_data } from "as-soroban-sdk/lib/env";

export function read_allowance(from: AddressObject, spender:AddressObject): Vec {

    // S_ALLOWANCE : map[from, map[sender, vec[amount, expiration_ledger]]]
    if (ledger.hasDataFor(S_ALLOWANCE, storageTypeTemporary)) {
        let dataMap = new Map(ledger.getDataFor(S_ALLOWANCE, storageTypeTemporary));
        if (dataMap.has(from)) {
            let spenderMap = new Map(dataMap.get(from));
            if (spenderMap.has(spender)) {
                let allowanceVec = new Vec(spenderMap.get(spender));
                let expirationLedger = toU32(allowanceVec.get(1));
                let currentSequence = context.getLedgerSequence();
                if (expirationLedger < currentSequence) {
                    let exVec = new Vec();
                    exVec.pushBack(fromI128Small(0));
                    exVec.pushBack(fromU32(expirationLedger));
                    return exVec;
                }
                return allowanceVec;
            }
        }
    }
    let zeroVec = new Vec();
    zeroVec.pushBack(fromI128Small(0));
    zeroVec.pushBack(fromU32(0));
    return zeroVec;
}

export function write_allowance(from: AddressObject, spender:AddressObject, amount: I128Val, expirationLedger: U32Val): void {

    if(isNegative(amount)) {
        context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
    }

    let amountGtZero = i128gt(amount, fromI128Small(0));
    let currentLedgerSequence = context.getLedgerSequence();

    if (amountGtZero && toU32(expirationLedger) < currentLedgerSequence) {
        context.failWithErrorCode(ERR_CODE.EXP_LEG_LESS_SEQ_WHEN_AMOUNT_GT_0)
    }

    let allowanceVec = new Vec();
    allowanceVec.pushBack(amount);
    allowanceVec.pushBack(expirationLedger);

    // S_ALLOWANCE : map[from, map[sender, vec[amount, expiration_ledger]]]
    if (!ledger.hasDataFor(S_ALLOWANCE, storageTypeTemporary)) {
        let dataMap = new Map();
        let spenderMap = new Map();
        spenderMap.put(spender, allowanceVec.getHostObject());
        dataMap.put(from, spenderMap.getHostObject());
        ledger.putDataFor(S_ALLOWANCE, dataMap.getHostObject(), storageTypeTemporary);
        return;
    }

    let dataMap = new Map(ledger.getDataFor(S_ALLOWANCE, storageTypeTemporary));
    
    if (dataMap.has(from)) {
        let spenderMap = new Map(dataMap.get(from));
        spenderMap.put(spender, allowanceVec.getHostObject());
        dataMap.put(from, spenderMap.getHostObject());
    } else {
        let spenderMap = new Map();
        spenderMap.put(spender, allowanceVec.getHostObject());
        dataMap.put(from, spenderMap.getHostObject());
    }

    ledger.putDataFor(S_ALLOWANCE, dataMap.getHostObject(), storageTypeTemporary);

    if (amountGtZero) {
        //let sub = toU32(expirationLedger) - currentLedgerSequence;
        bump_contract_data(fromSmallSymbolStr(S_ALLOWANCE), storageTypeTemporary, expirationLedger, expirationLedger);
    }
}

export function spend_allowance(from: AddressObject, spender:AddressObject, amount: I128Val): void {
    let allowance = read_allowance(from, spender);
    let allowanceAmount = allowance.get(0);

    if (i128lt(allowanceAmount, amount)) { 
        context.failWithErrorCode(ERR_CODE.INSUFFICIENT_ALLOWANCE);
    }

    write_allowance(from, spender, i128sub(allowanceAmount, amount), allowance.get(1));
}
