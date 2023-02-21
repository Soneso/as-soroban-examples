import { AddressObject, fromSymbolStr, RawVal, Signed128BitIntObject } from "as-soroban-sdk/lib/value";
import * as context from "as-soroban-sdk/lib/context";
import { Vec } from "as-soroban-sdk/lib/vec";

export function ev_i_allow(from: AddressObject, to:AddressObject, amount: Signed128BitIntObject): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("incr_allow"));
    topics.pushBack(from);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_d_allow(from: AddressObject, to:AddressObject, amount: Signed128BitIntObject): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("decr_allow"));
    topics.pushBack(from);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_trans(from: AddressObject, to:AddressObject, amount: Signed128BitIntObject): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("transfer"));
    topics.pushBack(from);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_mint(admin: AddressObject, to:AddressObject, amount: Signed128BitIntObject): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("mint"));
    topics.pushBack(admin);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_claw(admin: AddressObject, to:AddressObject, amount: Signed128BitIntObject): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("clawback"));
    topics.pushBack(admin);
    topics.pushBack(to);
    context.publishEvent(topics, amount);
}

export function ev_s_auth(admin: AddressObject, id:AddressObject, authorize: RawVal): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("set_auth"));
    topics.pushBack(admin);
    topics.pushBack(id);
    context.publishEvent(topics, authorize);
}

export function ev_s_admin(admin: AddressObject, new_admin:AddressObject): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("set_admin"));
    topics.pushBack(admin);
    context.publishEvent(topics, new_admin);
}

export function ev_burn(from: AddressObject, amount: Signed128BitIntObject): void {
    let topics = new Vec();
    topics.pushFront(fromSymbolStr("burn"));
    topics.pushBack(from);
    context.publishEvent(topics, amount);
}

