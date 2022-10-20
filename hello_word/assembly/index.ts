import {SymbolVal, VectorObject, fromSymbolStr} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function hello(to: SymbolVal): VectorObject {

  let vec = new Vec();
  vec.pushFront(fromSymbolStr("Hello"));
  vec.pushBack(to);
  
  return vec.getHostObject();
}