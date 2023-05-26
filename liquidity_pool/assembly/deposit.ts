import { I128Val, fromI128Pieces } from "as-soroban-sdk/lib/value";
import { i128le, i128lt, i128gt, i128isZero, i128muldiv} from "as-soroban-sdk/lib/val128";
import * as context from "as-soroban-sdk/lib/context";
import { ERR_CODES } from "./index";

export var __deposit_b: I128Val = fromI128Pieces(0,0);

export function get_deposit_amounts(desired_a: I128Val, min_a: I128Val, desired_b: I128Val, min_b: I128Val, reserve_a: I128Val, reserve_b: I128Val): I128Val {

    if (i128isZero(reserve_a) &&  i128isZero(reserve_b)) {
        __deposit_b = desired_b;
        return desired_a;
    }

    let amount_b = i128muldiv(desired_a, reserve_b, reserve_a);
    if (i128le(amount_b, desired_b)) {
        if (i128lt(amount_b, min_b)) {
            context.failWithErrorCode(ERR_CODES.AMOUNT_B_LESS_THAN_MIN);
        }
        __deposit_b = amount_b;
        return desired_a;
    } else {
        let amount_a = i128muldiv(desired_b, reserve_a, reserve_b);
        if(i128gt(amount_a, desired_a) || i128lt(desired_a, min_a)) {
            context.failWithErrorCode(ERR_CODES.AMOUNT_B_LESS_THAN_MIN);
        }
        __deposit_b = desired_b;
        return amount_a;
    }
}