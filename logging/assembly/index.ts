import * as context from 'as-soroban-sdk/lib/context';
import {VoidVal ,fromI32, fromSmallSymbolStr, fromVoid} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function logging(): VoidVal {

  context.logStr("Hello, today is a sunny day!");

  let args = new Vec();
  args.pushBack(fromI32(30));
  args.pushBack(fromSmallSymbolStr("celsius"));
  context.logFtm("We have {} degrees {}!", args);

  return fromVoid();
}