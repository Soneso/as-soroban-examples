import * as ledger from "as-soroban-sdk/lib/ledger";
import * as context from "as-soroban-sdk/lib/context";
import {AddressObject} from 'as-soroban-sdk/lib/value';
import { S_ADMIN, ERR_CODE} from "./util";

export function has_administrator(): bool {
    return ledger.hasDataFor(S_ADMIN);
}

export function read_administrator() : AddressObject {
    return ledger.getDataFor(S_ADMIN);
}

export function write_administrator(id: AddressObject) : void {
    return ledger.putDataFor(S_ADMIN, id);
}

export function check_admin(admin: AddressObject) : void {
    if (context.compare(admin, read_administrator()) != 0) {
        context.failWithErrorCode(ERR_CODE.NOT_AUTHORIZED_BY_ADMIN);
    }
}