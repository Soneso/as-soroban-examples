import * as ledger from "as-soroban-sdk/lib/ledger";
import {AddressObject, fromVoid, storageTypePersistent} from 'as-soroban-sdk/lib/value';
import { S_ADMIN } from "./util";

export function has_administrator(): bool {
    return ledger.hasDataFor(S_ADMIN, storageTypePersistent);
}

export function read_administrator() : AddressObject {
    return ledger.getDataFor(S_ADMIN, storageTypePersistent);
}

export function write_administrator(id: AddressObject) : void {
    return ledger.putDataFor(S_ADMIN, id, storageTypePersistent, fromVoid());
}