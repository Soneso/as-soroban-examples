import * as val from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function hello(to: val.SymbolVal): val.VectorObject {

  let vec = new Vec();
  vec.push_front(val.fromString("Hello"));
  vec.push_back(to);
  
  return vec.getHostObject();
}