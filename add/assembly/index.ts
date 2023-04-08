import { I32Val, toI32, fromI32 } from 'as-soroban-sdk/lib/value';

export function add(a: I32Val, b: I32Val): I32Val {

  let ai32 = toI32(a);
  let bi32 = toI32(b);

  return (fromI32(ai32 + bi32));
}