import { AddressObject, fromSmallSymbolStr, RawVal, I128Object } from "as-soroban-sdk/lib/value";
import * as context from "as-soroban-sdk/lib/context";
import { Vec } from "as-soroban-sdk/lib/vec";
import { Sym } from "as-soroban-sdk/lib/sym";

export function ev_i_allow(from: AddressObject, to:AddressObject, amount: I128Object): void {
    let topics = new Vec();
    topics.pushFront(Sym.fromSymbolString("incr_allow").getHostObject()); // more than 9 chars
    topics.pushBack(from);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_d_allow(from: AddressObject, to:AddressObject, amount: I128Object): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("dec_allow"));
    topics.pushBack(from);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_trans(from: AddressObject, to:AddressObject, amount: I128Object): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("transfer"));
    topics.pushBack(from);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_mint(admin: AddressObject, to:AddressObject, amount: I128Object): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("mint"));
    topics.pushBack(admin);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_claw(admin: AddressObject, to:AddressObject, amount: I128Object): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("clawback"));
    topics.pushBack(admin);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_s_auth(admin: AddressObject, id:AddressObject, authorize: RawVal): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("set_auth"));
    topics.pushBack(admin);
    topics.pushBack(id);
    context.publishEvent(topics, authorize);
}

export function ev_s_admin(admin: AddressObject, new_admin:AddressObject): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("set_admin"));
    topics.pushBack(admin);
    context.publishEvent(topics, new_admin);
}

export function ev_burn(from: AddressObject, amount: I128Object): void {
    let topics = new Vec();
    topics.pushFront(fromSmallSymbolStr("burn"));
    topics.pushBack(from);
    context.publishEvent(topics, amount);
}

