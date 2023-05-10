import * as ledger from "as-soroban-sdk/lib/ledger";
import * as context from "as-soroban-sdk/lib/context";
import {Map} from "as-soroban-sdk/lib/map";
import { AddressObject, fromI128Small, I128Val } from "as-soroban-sdk/lib/value";
import { isNegative, i128lt, i128sub } from "as-soroban-sdk/lib/val128";
import { ERR_CODE, S_ALLOWANCE } from "./util";

export function read_allowance(from: AddressObject, spender:AddressObject): I128Val {

    // S_ALLOWANCE : map[from, map[sender, amout]]
    if (ledger.hasDataFor(S_ALLOWANCE)) {
        let dataMap = new Map(ledger.getDataFor(S_ALLOWANCE));
        if (dataMap.has(from)) {
            let spenderMap = new Map(dataMap.get(from));
            if (spenderMap.has(spender)) {
                return spenderMap.get(spender);
            }
        }
    }

    return fromI128Small(0);
}

export function write_allowance(from: AddressObject, spender:AddressObject, amount: I128Val): void {

    if(isNegative(amount)) {
        context.failWithErrorCode(ERR_CODE.NEG_AMOUNT_NOT_ALLOWED);
    }

    // S_ALLOWANCE : map[from, map[sender, amout]]
    if (!ledger.hasDataFor(S_ALLOWANCE)) {
        let dataMap = new Map();
        let spenderMap = new Map();
        spenderMap.put(spender, amount);
        dataMap.put(from, spenderMap.getHostObject());
        ledger.putDataFor(S_ALLOWANCE, dataMap.getHostObject());
        return;
    }

    let dataMap = new Map(ledger.getDataFor(S_ALLOWANCE));
    
    if (dataMap.has(from)) {
        let spenderMap = new Map(dataMap.get(from));
        spenderMap.put(spender, amount);
        dataMap.put(from, spenderMap.getHostObject());
    } else {
        let spenderMap = new Map();
        spenderMap.put(spender, amount);
        dataMap.put(from, spenderMap.getHostObject());
    }

    ledger.putDataFor(S_ALLOWANCE, dataMap.getHostObject());
}

export function spend_allowance(from: AddressObject, spender:AddressObject, amount: I128Val): void {
    let allowance = read_allowance(from, spender);

    if (i128lt(allowance, amount)) { 
        context.failWithErrorCode(ERR_CODE.INSUFFICIENT_ALLOWANCE);
    }

    write_allowance(from, spender, i128sub(allowance, amount));
}
