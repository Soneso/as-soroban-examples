import {fromSmallSymbolStr, Val, U32Val, toU32} from 'as-soroban-sdk/lib/value';
import * as context from "as-soroban-sdk/lib/context";

enum AGE_ERR_CODES {
  TOO_YOUNG = 1,
  TOO_OLD = 2
}

export function checkAge(age: U32Val): Val {

  let age2check = toU32(age);

  context.logMgsAndValue("Age", age);

  if (age2check < 18) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_YOUNG);
  }

  if (age2check > 99) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_OLD);
  }

  return fromSmallSymbolStr("OK");
}