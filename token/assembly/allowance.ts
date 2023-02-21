import * as ledger from "as-soroban-sdk/lib/ledger";
import * as context from "as-soroban-sdk/lib/context";
import {Map} from "as-soroban-sdk/lib/map";
import { AddressObject, fromI128Pieces, Signed128BitIntObject } from "as-soroban-sdk/lib/value";
import { ERR_CODE, S_ALLOWANCE, isNeg, lt, sub_amounts } from "./util";

export function read_allowance(from: AddressObject, spender:AddressObject): Signed128BitIntObject {

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

    return fromI128Pieces(0,0);
}

export function write_allowance(from: AddressObject, spender:AddressObject, amount: Signed128BitIntObject): void {

    if(isNeg(amount)) {
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

export function spend_allowance(from: AddressObject, spender:AddressObject, amount: Signed128BitIntObject): void {
    let allowance = read_allowance(from, spender);

    if (lt(allowance, amount)) { 
        context.failWithErrorCode(ERR_CODE.INSUFFICIENT_ALLOWANCE);
    }

    write_allowance(from, spender, sub_amounts(allowance, amount));
}
