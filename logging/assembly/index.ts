import * as context from 'as-soroban-sdk/lib/context';
import * as val from 'as-soroban-sdk/lib/value';
import {Vec} from 'as-soroban-sdk/lib/vec';

export function logging(): val.RawVal {

  context.log_str("Hello, today is a sunny day!");

  let args = new Vec();
  args.push_back(val.fromI32(30));
  args.push_back(val.fromString("celsius"));
  context.log_ftm("We have {} degrees {}!", args);

  return val.fromVoid();

}