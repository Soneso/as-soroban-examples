import * as ledger from "as-soroban-sdk/lib/ledger";
import { BytesObject, RawVal } from "as-soroban-sdk/lib/value";
import { S_DECIMALS, S_NAME, S_SYMBOL} from "./util";

export function read_decimal(): RawVal {
    return ledger.getDataFor(S_DECIMALS);
}

export function write_decimal(d: RawVal): void {
    ledger.putDataFor(S_DECIMALS, d);
}

export function read_name(): BytesObject {
    return ledger.getDataFor(S_NAME);
}

export function write_name(n: BytesObject): void {
    ledger.putDataFor(S_NAME, n);
}

export function read_symbol(): BytesObject {
    return ledger.getDataFor(S_SYMBOL);
}

export function write_symbol(s: BytesObject): void {
    ledger.putDataFor(S_SYMBOL, s);
}