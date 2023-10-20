import { I32Val, toI32, fromI32 } from 'as-soroban-sdk/lib/value';

export function add(a: I32Val, b: I32Val): I32Val {

  // decode arguments from host values to i32 primitives
  let ai:i32 = toI32(a);
  let bi:i32 = toI32(b);

  // add
  let sum = ai + bi;
  
  // encode to host value
  let result = fromI32(sum);

  // return host value
  return result;
}