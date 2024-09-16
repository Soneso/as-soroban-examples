import {AddressObject, BytesObject, I128Val, fromSmallSymbolStr, fromVoid, VecObject, fromU32, toU32, VoidVal, fromI128Pieces, fromI128Small, U32Val, storageTypeInstance} from "as-soroban-sdk/lib/value";
import * as context from "as-soroban-sdk/lib/context";
import * as ledger from "as-soroban-sdk/lib/ledger";
import * as address from "as-soroban-sdk/lib/address";
import * as crypto from "as-soroban-sdk/lib/crypto";
import { Vec } from "as-soroban-sdk/lib/vec";
import { Bytes} from "as-soroban-sdk/lib/bytes";
import { Sym } from "as-soroban-sdk/lib/sym";
import { __deposit_b, get_deposit_amounts } from "./deposit";
import { i128Add, i128Div, i128IsGreaterThan, i128IsLowerThan, i128IsEqual, i128Mul, i128MulDiv, i128Sub } from "as-soroban-sdk/lib/arithm128";
import {i128sqrt} from "as-soroban-sdk/lib/val128";
import { call, create_contract, serialize_to_bytes } from "as-soroban-sdk/lib/env";


enum DATA_KEY {
  TOKEN_A = 0,
  TOKEN_B = 1,
  TOKEN_SHARE = 2,
  TOTAL_SHARES = 3,
  RESERVE_A = 4,
  RESERVE_B = 5
}

export enum ERR_CODES {
  TOKEN_A_MUST_BE_LESS_TOKEN_B = 1,
  TOO_MANY_CLAIMANTS = 2,
  NO_BALANCE = 3,
  TIME_PREDICATE_NOT_FULFILLED = 4,
  CLAIMANT_NOT_ALLOWED = 5,
  AMOUNT_B_LESS_THAN_MIN = 6,
  AMOUNT_A_INVALID = 7,
  IN_AMOUNT_IS_OVER_MAX = 8,
  CONST_PROD_INVARIANT_DOESE_NOT_HOLD = 9,
  MIN_NOT_SATISFIED = 10
}

export function initialize(token_wasm_hash: BytesObject, token_a: AddressObject, token_b: AddressObject): VoidVal {

  if (context.compareObj(token_a, token_b) != -1) { // token_a >= token_b
    context.failWithErrorCode(ERR_CODES.TOKEN_A_MUST_BE_LESS_TOKEN_B);
  }

  let share_contract = create_ctr(token_wasm_hash, token_a, token_b);

  let args = new Vec();
  args.pushBack(context.getCurrentContractAddress());
  args.pushBack(fromU32(7));
  let name = Bytes.fromString("Pool Share Token");
  args.pushBack(name.getHostObject());
  let symbol = Bytes.fromString("POOL");
  args.pushBack(symbol.getHostObject());

  call(share_contract, Sym.fromSymbolString("initialize").getHostObject(), args.getHostObject());

  put_token_a(token_a);
  put_token_b(token_b);
  put_token_share(share_contract);
  put_total_shares(fromI128Pieces(0,0));
  put_reserve_a(fromI128Pieces(0,0));
  put_reserve_b(fromI128Pieces(0,0));

  return fromVoid();
}

export function share_addr() : AddressObject {
  return get_token_share();
}

export function deposit(to: AddressObject, desired_a: I128Val, min_a: I128Val, desired_b: I128Val, min_b: I128Val) : VoidVal {
  // Depositor needs to authorize the deposit
  address.requireAuth(to);

  let reserve_a = get_reserve_a();
  let reserve_b = get_reserve_b();

  // Calculate deposit amounts
  let amount_a = get_deposit_amounts(desired_a, min_a, desired_b, min_b, reserve_a, reserve_b);
  let amount_b = __deposit_b;

  let current_contract_address = context.getCurrentContractAddress();

  let transferArgs = new Vec();
  transferArgs.pushBack(to);
  transferArgs.pushBack(current_contract_address);
  transferArgs.pushBack(amount_a);
  let token_a = get_token_a();
  call(token_a, fromSmallSymbolStr("transfer"), transferArgs.getHostObject());

  transferArgs.popBack();
  transferArgs.pushBack(amount_b);
  let token_b = get_token_b();
  call(token_b, fromSmallSymbolStr("transfer"), transferArgs.getHostObject());  

  // Now calculate how many new pool shares to mint
  let balance_a = get_balance_a();
  let balance_b = get_balance_b();
  let total_shares = get_total_shares();

  let zero = fromI128Small(0);
  let new_total_shares = zero;
  if (i128IsGreaterThan(reserve_a, zero) && i128IsGreaterThan(reserve_b, zero)) {
    let shares_a = i128MulDiv(balance_a, total_shares, reserve_a);
    let shares_b = i128MulDiv(balance_b, total_shares, reserve_b);
    if(i128IsLowerThan(shares_a, shares_b) || i128IsEqual(shares_a, shares_b)) {
      new_total_shares = shares_a;
    } else {
      new_total_shares = shares_b;
    }
  } else {
    let mul = i128Mul(balance_a, balance_b);
    new_total_shares = i128sqrt(mul);
  }
  
  mint_shares(to, i128Sub(new_total_shares, total_shares));
  put_reserve_a(balance_a);
  put_reserve_b(balance_b);

  return fromVoid();
}


export function swap(to: AddressObject, buy_a: U32Val, out: I128Val, in_max: I128Val) : VoidVal {

  address.requireAuth(to);

  let reserve_a = get_reserve_a();
  let reserve_b = get_reserve_b();

  let reserve_sell = reserve_a;
  let reserve_buy = reserve_b;

  let buy = toU32(buy_a) > 0; // TODO: replace with bool ass soon as it can be passed by the cli
  // let buy = toBool(buy_a);
  if (buy) {
    reserve_sell = reserve_b;
    reserve_buy = reserve_a;
  }

  // First calculate how much needs to be sold to buy amount out from the pool

  let n = i128Mul(i128Mul(reserve_sell, out), fromI128Small(1000));
  let d = i128Mul(i128Sub(reserve_buy, out), fromI128Small(997));
  let sell_amount = i128Add(i128Div(n,d), fromI128Small(1));
  if (i128IsGreaterThan(sell_amount, in_max)) {
    context.failWithErrorCode(ERR_CODES.IN_AMOUNT_IS_OVER_MAX);
  }

  // Xfer the amount being sold to the contract
  let sell_token = get_token_a();
  if (buy) {
    sell_token = get_token_b();
  }

  let current_contract_address = context.getCurrentContractAddress();

  let transferArgs = new Vec();
  transferArgs.pushBack(to);
  transferArgs.pushBack(current_contract_address);
  transferArgs.pushBack(sell_amount);
  call(sell_token, fromSmallSymbolStr("transfer"), transferArgs.getHostObject());

  let balance_a = get_balance_a();
  let balance_b = get_balance_b();

  // residue_numerator and residue_denominator are the amount that the invariant considers after
  // deducting the fee, scaled up by 1000 to avoid fractions

  let residue_numerator = fromI128Small(997);
  let residue_denominator = fromI128Small(1000);
  let zero = fromI128Small(0);

  let out_a = zero;
  let out_b = zero;
  if (buy) {
    out_a = out;
  } else {
    out_b = out;
  }

  let new_inv_a = invariant_factor(balance_a, reserve_a, out_a, residue_numerator, residue_denominator);
  let new_inv_b = invariant_factor(balance_b, reserve_b, out_b, residue_numerator, residue_denominator);
  let old_inv_a = i128Mul(residue_denominator, reserve_a);
  let old_inv_b = i128Mul(residue_denominator, reserve_b);

  if (i128IsLowerThan(i128Mul(new_inv_a, new_inv_b), i128Mul(old_inv_a, old_inv_b))) { // new_inv_a * new_inv_b < old_inv_a * old_inv_b
    context.failWithErrorCode(ERR_CODES.CONST_PROD_INVARIANT_DOESE_NOT_HOLD);
  }

  if(buy) {
    transfer_a(to, out_a);
  } else {
    transfer_b(to, out_b);
  }

  put_reserve_a(i128Sub(balance_a, out_a));
  put_reserve_b(i128Sub(balance_b, out_b));

  return fromVoid();
}

export function withdraw(to: AddressObject, share_amount: I128Val, min_a: I128Val, min_b: I128Val) :  VecObject {
  address.requireAuth(to);

  // First transfer the pool shares that need to be redeemed
  let share_token = get_token_share();

  let current_contract_address = context.getCurrentContractAddress();

  let transferArgs = new Vec();
  transferArgs.pushBack(to);
  transferArgs.pushBack(current_contract_address);
  transferArgs.pushBack(share_amount);
  call(share_token, fromSmallSymbolStr("transfer"), transferArgs.getHostObject());

  let balance_a = get_balance_a();
  let balance_b = get_balance_b();

  let balance_shares = get_balance_shares();
  let total_shares = get_total_shares();

  // Now calculate the withdraw amounts
  let out_a = i128MulDiv(balance_a, balance_shares, total_shares);
  let out_b = i128MulDiv(balance_b, balance_shares, total_shares);

  if (i128IsLowerThan(out_a, min_a) || i128IsLowerThan(out_b, min_b)) {
    context.failWithErrorCode(ERR_CODES.MIN_NOT_SATISFIED);
  }

  burn_shares(balance_shares);
  transfer_a(to, out_a);
  transfer_b(to, out_b);
  put_reserve_a(i128Sub(balance_a, out_a));
  put_reserve_b(i128Sub(balance_b, out_b));

  let result = new Vec();
  result.pushBack(out_a);
  result.pushBack(out_b);

  return result.getHostObject();
}

export function get_rsrvs() :  VecObject {

  let result = new Vec();
  result.pushBack(get_reserve_a());
  result.pushBack(get_reserve_b());

  return result.getHostObject();
}

function put_token_a(address: AddressObject) : void {
  ledger.putData(fromU32(DATA_KEY.TOKEN_A), address, storageTypeInstance);
}

function get_token_a() : BytesObject {
  return ledger.getData(fromU32(DATA_KEY.TOKEN_A), storageTypeInstance);
}

function put_token_b(address: AddressObject) : void {
  ledger.putData(fromU32(DATA_KEY.TOKEN_B), address, storageTypeInstance);
}

function get_token_b() : BytesObject {
  return ledger.getData(fromU32(DATA_KEY.TOKEN_B), storageTypeInstance);
}

function put_token_share(address: AddressObject) : void {
  ledger.putData(fromU32(DATA_KEY.TOKEN_SHARE), address, storageTypeInstance);
}

function get_token_share() : AddressObject {
  return ledger.getData(fromU32(DATA_KEY.TOKEN_SHARE), storageTypeInstance);
}

function put_total_shares(amount: I128Val) : void {
  ledger.putData(fromU32(DATA_KEY.TOTAL_SHARES), amount, storageTypeInstance);
}

function get_total_shares() : I128Val {
  return ledger.getData(fromU32(DATA_KEY.TOTAL_SHARES), storageTypeInstance);
}

function put_reserve_a(amount: I128Val) : void {
  ledger.putData(fromU32(DATA_KEY.RESERVE_A), amount, storageTypeInstance);
}

function get_reserve_a() : I128Val {
  return ledger.getData(fromU32(DATA_KEY.RESERVE_A), storageTypeInstance);
}

function put_reserve_b(amount: I128Val) : void {
  ledger.putData(fromU32(DATA_KEY.RESERVE_B), amount, storageTypeInstance);
}

function get_reserve_b() : I128Val{
  return ledger.getData(fromU32(DATA_KEY.RESERVE_B), storageTypeInstance);
}

function get_balance(contract_id: BytesObject) : I128Val {

  let current_contract_address = context.getCurrentContractAddress();
  let args = new Vec();
  args.pushBack(current_contract_address);
  return call(contract_id, fromSmallSymbolStr("balance"), args.getHostObject());

}

function get_balance_a() : I128Val {
  return get_balance(get_token_a());
}

function get_balance_b() : I128Val {
  return get_balance(get_token_b());
}

function get_balance_shares() : I128Val {
  return get_balance(get_token_share());
}

function mint_shares(to: AddressObject, amount: I128Val) : void {
   let total = get_total_shares();
   let share_contract = get_token_share();

   let mintArgs = new Vec();
   mintArgs.pushBack(to);
   mintArgs.pushBack(amount);
   call(share_contract, fromSmallSymbolStr("mint"), mintArgs.getHostObject());

   put_total_shares(i128Add(total, amount));

}

function burn_shares(amount: I128Val) : void {
  let total = get_total_shares();
  let share_contract = get_token_share();
  let current_contract_address = context.getCurrentContractAddress();

  let burnArgs = new Vec();
  burnArgs.pushBack(current_contract_address);
  burnArgs.pushBack(amount);
  call(share_contract, fromSmallSymbolStr("burn"), burnArgs.getHostObject());

  put_total_shares(i128Sub(total, amount));

}


function invariant_factor(balance: I128Val, reserve: I128Val, out:I128Val, residue_numerator: I128Val, residue_denominator:I128Val) : I128Val {
    
  let delta = i128Sub(i128Sub(balance, reserve), out);
  let zero = fromI128Small(0);
  
  let adj_delta = zero;
  if (i128IsGreaterThan(delta,zero)) {
    adj_delta = i128Mul(residue_numerator, delta);
  } else {
    adj_delta = i128Mul(residue_denominator, delta);
  }

  return i128Add(i128Mul(residue_denominator, reserve), adj_delta);
}

function transfer(contract_id: BytesObject, to: AddressObject, amount: I128Val) : void {

  let current_contract_address = context.getCurrentContractAddress();

  let transferArgs = new Vec();
  transferArgs.pushBack(current_contract_address);
  transferArgs.pushBack(to);
  transferArgs.pushBack(amount);
  call(contract_id, fromSmallSymbolStr("transfer"), transferArgs.getHostObject());

}

function transfer_a(to: AddressObject, amount: I128Val) : void {
  transfer(get_token_a(), to, amount);
}

function transfer_b(to: AddressObject, amount: I128Val) : void {
  transfer(get_token_b(), to, amount);
}

function create_ctr(token_wasm_hash: BytesObject, token_a: AddressObject, token_b: AddressObject): AddressObject {

  let salt = new Bytes();
  salt.append(new Bytes(serialize_to_bytes(token_a)));
  salt.append(new Bytes(serialize_to_bytes(token_b)));

  let cSalt = crypto.computeHashSha256(salt);
  return create_contract(context.getCurrentContractAddress(), token_wasm_hash, cSalt.getHostObject());

}