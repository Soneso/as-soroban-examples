import {SymbolVal, VectorObject, fromString} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function hello(to: SymbolVal): VectorObject {

  let vec = new Vec();
  vec.push_front(fromString("Hello"));
  vec.push_back(to);
  
  return vec.getHostObject();
}