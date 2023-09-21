import * as ledger from "as-soroban-sdk/lib/ledger";
import { AddressObject, U32Val, storageTypeInstance } from "as-soroban-sdk/lib/value";
import { Vec } from "as-soroban-sdk/lib/vec";

const S_OFFER = "Offer";

enum DATA_INDEX {
    SELLER = 0,
    SELL_TOKEN = 1,
    BUY_TOKEN = 2,
    SELL_PRICE = 3,
    BUY_PRICE = 4,
}

// Represents an offer managed by the single offer sale contract.
// If a seller wants to sell 1000 XLM for 100 USDC the `sell_price` would be 1000
// and `buy_price` would be 100 (or 100 and 10, or any other pair of integers
// in 10:1 ratio).
export let __seller: AddressObject = 0; // Owner of this offer. Sells sell_token to get buy_token.
export let __sell_token: AddressObject = 0;
export let __buy_token: AddressObject = 0;
export let __sell_price: U32Val = 0; // Seller-defined price of the sell token in arbitrary units.
export let __buy_price: U32Val = 0; // Seller-defined price of the buy token in arbitrary units.
  
export function has_offer() : bool {
    return ledger.hasDataFor(S_OFFER, storageTypeInstance);
}

export function write_offer(seller: AddressObject,
    sell_token:AddressObject,
    buy_token:AddressObject,
    sell_price:U32Val,
    buy_price:U32Val): void {

    let offerVec = new Vec();
    offerVec.pushBack(seller);
    offerVec.pushBack(sell_token);
    offerVec.pushBack(buy_token);
    offerVec.pushBack(sell_price);
    offerVec.pushBack(buy_price);

    ledger.putDataFor(S_OFFER, offerVec.getHostObject(), storageTypeInstance);

    __seller = seller;
    __sell_token = sell_token;
    __buy_token = buy_token;
    __sell_price = sell_price;
    __buy_price = buy_price;

}

export function load_offer(): void {
    let offerVec = new Vec(ledger.getDataFor(S_OFFER, storageTypeInstance));

    __seller = offerVec.get(DATA_INDEX.SELLER);
    __sell_token = offerVec.get(DATA_INDEX.SELL_TOKEN);
    __buy_token = offerVec.get(DATA_INDEX.BUY_TOKEN);
    __sell_price = offerVec.get(DATA_INDEX.SELL_PRICE);
    __buy_price = offerVec.get(DATA_INDEX.BUY_PRICE);
}






