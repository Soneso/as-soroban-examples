import * as context from 'as-soroban-sdk/lib/context';
import {RawVal,fromI32, fromString, fromVoid} from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function logging(): RawVal {

  context.log_str("Hello, today is a sunny day!");

  let args = new Vec();
  args.push_back(fromI32(30));
  args.push_back(fromString("celsius"));
  context.log_ftm("We have {} degrees {}!", args);

  return fromVoid();

}