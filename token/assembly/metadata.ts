import * as ledger from "as-soroban-sdk/lib/ledger";
import { BytesObject, Val, storageTypePersistent } from "as-soroban-sdk/lib/value";
import { S_DECIMALS, S_NAME, S_SYMBOL} from "./util";

export function read_decimal(): Val {
    return ledger.getDataFor(S_DECIMALS, storageTypePersistent);
}

export function write_metadata(decimal: Val, name: BytesObject, symbol: BytesObject): void {
    ledger.putDataFor(S_DECIMALS, decimal, storageTypePersistent);
    ledger.putDataFor(S_NAME, name, storageTypePersistent);
    ledger.putDataFor(S_SYMBOL, symbol, storageTypePersistent);
}

export function read_name(): BytesObject {
    return ledger.getDataFor(S_NAME, storageTypePersistent);
}

export function read_symbol(): BytesObject {
    return ledger.getDataFor(S_SYMBOL, storageTypePersistent);
}