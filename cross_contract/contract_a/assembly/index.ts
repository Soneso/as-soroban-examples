import * as val from 'as-soroban-sdk/lib/value';

export function add(a: val.RawVal, b: val.RawVal): val.RawVal {

  let ai32 = val.toI32(a);
  let bi32 = val.toI32(b);

  return (val.fromI32(ai32 + bi32));
}