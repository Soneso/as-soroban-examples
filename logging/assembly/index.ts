import * as context from 'as-soroban-sdk/lib/context';
import {VoidVal ,fromI32, fromSmallSymbolStr, fromVoid} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function logging(): VoidVal {

  context.logStr("Hello, today is a sunny day!");

  let values = new Vec();
  values.pushBack(fromI32(30));
  values.pushBack(fromSmallSymbolStr("celsius"));
  context.log("Temperature today:", values);

  context.logMgsAndValue("Test", fromI32(-12))
  
  return fromVoid();
}