import {fromSymbolStr, RawVal, toI32} from 'as-soroban-sdk/lib/value';
import * as context from "as-soroban-sdk/lib/context";

enum ALLOWED_AGE_RANGE {
  MIN = 18,
  MAX = 99
}

enum AGE_ERR_CODES {
  TOO_YOUNG = 1,
  TOO_OLD = 2
}

export function checkAge(age: RawVal): RawVal {

  let age2check = toI32(age);

  if (age2check < ALLOWED_AGE_RANGE.MIN) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_YOUNG);
  }

  if (age2check > ALLOWED_AGE_RANGE.MAX) {
    context.failWithErrorCode(AGE_ERR_CODES.TOO_OLD);
  }

  return fromSymbolStr("OK");
}