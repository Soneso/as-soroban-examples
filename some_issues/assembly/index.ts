import {RawVal, fromU32} from 'as-soroban-sdk/lib/value';

export function add_str(): RawVal {

/*****************************************************************************
* Problem: adding strings          
* uncomment the code line below, compile and run the contract to see the error
* README.md for more details on how to compile and run.
******************************************************************************/
  
// let a = "b" + "c";

/****
 * Error you will get:
 * error: HostError
 * Value: Status(VmError(Validation))
 * Debug events (newest first):
 * 0: "Validation"
 */
  
  return fromU32(1);
}