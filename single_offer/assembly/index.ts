//! This contract implements trading of one token pair between one seller and
//! multiple buyer.
//! It demonstrates one of the ways of how trading might be implemented.

/*
How this contract should be used:
1. Call `create` once to create the offer and register its seller.
2. Seller may transfer arbitrary amounts of the `sell_token` for sale to the
   contract address for trading. They may also update the offer price.
3. Buyers may call `trade` to trade with the offer. The contract will
   immediately perform the trade and send the respective amounts of `buy_token`
   and `sell_token` to the seller and buyer respectively.
4. Seller may call `withdraw` to claim any remaining `sell_token` balance.
*/

import { AddressObject, U32Val, VoidVal, toU32, fromVoid, I128Val, fromI128Small } from "as-soroban-sdk/lib/value";
import * as context from "as-soroban-sdk/lib/context";
import * as contract from "as-soroban-sdk/lib/contract";
import * as address from "as-soroban-sdk/lib/address";
import { has_offer, write_offer, load_offer, __sell_price, __buy_price, __buy_token, __sell_token, __seller } from "./offer";
import { Vec } from "as-soroban-sdk/lib/vec";
import { i128lt, i128muldiv } from "as-soroban-sdk/lib/val128";

enum ERR_CODE {
  OFFER_ALREADY_EXISTS = 1,
  ZERO_PRICE_NOT_ALLOWED = 2,
  HAS_NO_OFFER = 3,
  PRICE_IS_TOO_LOW = 4,
}

/**
 * Creates the offer for seller for the given token pair and initial price. See also comment above.
 * @param seller Owner of this offer. Sells sell_token to get buy_token.
 * @param sell_token Token to sell.
 * @param buy_token Token to buy.
 * @param sell_price Seller-defined price of the sell token in arbitrary units.
 * @param buy_price Seller-defined price of the buy token in arbitrary units.
 * @returns void
 */
export function create(seller: AddressObject, sell_token: AddressObject, buy_token:AddressObject, sell_price:U32Val, buy_price:U32Val): VoidVal {
  if (has_offer()) {
    context.failWithErrorCode(ERR_CODE.OFFER_ALREADY_EXISTS);
  }

  if (toU32(buy_price) == 0 || toU32(sell_price) == 0) {
    context.failWithErrorCode(ERR_CODE.ZERO_PRICE_NOT_ALLOWED);
  }

  // Authorize the `create` call by seller to verify their identity.
  address.requireAuth(seller);
  
  write_offer(seller, sell_token, buy_token, sell_price, buy_price);

  return fromVoid();
}

// Trades `buy_token_amount` of buy_token from buyer for `sell_token` amount
// defined by the price.
// `min_sell_amount` defines a lower bound on the price that the buyer would
// accept.
// Buyer needs to authorize the `trade` call and internal `xfer` call to
// the contract address.
export function trade(buyer: AddressObject, buy_token_amount: I128Val, min_sell_token_amount: I128Val) : VoidVal {
  // Buyer needs to authorize the trade.
  address.requireAuth(buyer);

  // Load the offer
  if (!has_offer()) {
    context.failWithErrorCode(ERR_CODE.HAS_NO_OFFER);
  }

  load_offer();
  
  // Compute the amount of token that buyer needs to receive.
  let sell_price = fromI128Small(toU32(__sell_price) as u64);
  let buy_price = fromI128Small(toU32(__buy_price) as u64);
  let sell_token_amount = i128muldiv(buy_token_amount, sell_price, buy_price);

  if (i128lt(sell_token_amount, min_sell_token_amount)) {
    context.failWithErrorCode(ERR_CODE.PRICE_IS_TOO_LOW);
  }

  let contract_address =  context.getCurrentContractAddress();

  // Perform the trade in 3 `transfer` steps.
  // Note, that we don't need to verify any balances - the contract would
  // just trap and roll back in case if any of the transfers fails for
  // any reason, including insufficient balance.

  // Transfer the `buy_token` from buyer to this contract.
  // This `transfer` call should be authorized by buyer.
  // This could as well be a direct transfer to the seller, but sending to
  // the contract address allows building more transparent signature
  // payload where the buyer doesn't need to worry about sending token to
  // some 'unknown' third party.
  let transferArgs1 = new Vec();
  transferArgs1.pushBack(buyer);
  transferArgs1.pushBack(contract_address);
  transferArgs1.pushBack(buy_token_amount);
  contract.callContract(__buy_token, "transfer", transferArgs1);

  // Transfer the `sell_token` from contract to buyer.
  let transferArgs2 = new Vec();
  transferArgs2.pushBack(contract_address);
  transferArgs2.pushBack(buyer);
  transferArgs2.pushBack(sell_token_amount);
  contract.callContract(__sell_token, "transfer", transferArgs2);

  // Transfer the `buy_token` to the seller immediately.
  let transferArgs3 = new Vec();
  transferArgs3.pushBack(contract_address);
  transferArgs3.pushBack(__seller);
  transferArgs3.pushBack(buy_token_amount);
  contract.callContract(__buy_token, "transfer", transferArgs3);

  return fromVoid();

}

// Sends amount of token from this contract to the seller.
// This is intentionally flexible so that the seller can withdraw any
// outstanding balance of the contract (in case if they mistakenly transferred wrong token to it).
// Must be authorized by seller.
export function withdraw(token: AddressObject, amount: I128Val) : VoidVal {

    // Load the offer
    if (!has_offer()) {
      context.failWithErrorCode(ERR_CODE.HAS_NO_OFFER);
    }
    load_offer();

    address.requireAuth(__seller);

    let contract_address =  context.getCurrentContractAddress();

    let transferArgs = new Vec();
    transferArgs.pushBack(contract_address);
    transferArgs.pushBack(__seller);
    transferArgs.pushBack(amount);
    contract.callContract(token, "transfer", transferArgs);

  return fromVoid();
}

// Updates the price.
// Must be authorized by seller.
export function updt_price(sell_price:U32Val, buy_price:U32Val) : VoidVal {

  if(toU32(sell_price) == 0 || toU32(buy_price) == 0) {
    context.failWithErrorCode(ERR_CODE.ZERO_PRICE_NOT_ALLOWED);
  }

  // Load the offer
  if (!has_offer()) {
    context.failWithErrorCode(ERR_CODE.HAS_NO_OFFER);
  }
  load_offer();

  address.requireAuth(__seller);

  write_offer(__seller, __sell_token, __buy_token, sell_price, buy_price);
  
  return fromVoid();
}