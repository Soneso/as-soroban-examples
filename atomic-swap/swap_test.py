"""This test invokes a given atomic swap contract to swap two tokens.

See https://soroban.stellar.org/docs/how-to-guides/atomic-swap
https://soroban.stellar.org/docs/learn/authorization
"""

import time
import sys

from stellar_sdk import Network, Keypair, TransactionBuilder, InvokeHostFunction
from stellar_sdk import xdr as stellar_xdr
from stellar_sdk.soroban import SorobanServer
from stellar_sdk.soroban.authorization_entry import AuthorizationEntry
from stellar_sdk.soroban.soroban_rpc import GetTransactionStatus
from stellar_sdk.soroban.types import Address, Int128

rpc_server_url = "https://rpc-futurenet.stellar.org:443/"
soroban_server = SorobanServer(rpc_server_url)
network_passphrase = Network.FUTURENET_NETWORK_PASSPHRASE

submitter_kp = Keypair.from_secret(
    "SAAPYAPTTRZMCUZFPG3G66V4ZMHTK4TWA6NS7U4F7Z3IMUD52EK4DDEV"
)
alice_kp = Keypair.from_secret(
    "SBSJM6ISC2I6DCMPAMOXW3WMXWWJ53IRCXIRLOBL7T5XHKLPZKQTGSXH"
)
bob_kp = Keypair.from_secret(
    "SDOBRTNMP5A4ORTKT2J47F7GCSLCYXAMII3KMWV4JBN4RI3CCZWD4XE3"
)
atomic_swap_contract_id = (sys.argv[1])
native_token_contract_id = "CCLE4PGRKHYFDSSBXVR5FZ4VJDPKQXV2YTNVKBS2SFEHGFZZDJOASRLW"
cat_token_contract_id = "CAZ3333PHW6EYXIZOPXZRH5AU3J3R2OS2USRH7E3KM6ZDDQ7H6HTYGJ6"


source = soroban_server.load_account(submitter_kp.public_key)

args = [
    Address(alice_kp.public_key),  # a
    Address(bob_kp.public_key),  # b
    Address(native_token_contract_id),  # token_a
    Address(cat_token_contract_id),  # token_b
    Int128(1000),  # amount_a
    Int128(4500),  # min_b_for_a
    Int128(5000),  # amount_b
    Int128(950),  # min_a_for_b
]

tx = (
    TransactionBuilder(source, network_passphrase)
    .add_time_bounds(0, 0)
    .append_invoke_contract_function_op(
        contract_id=atomic_swap_contract_id,
        function_name="swap",
        parameters=args,
    )
    .build()
)

tx = soroban_server.prepare_transaction(tx)
tx.transaction.fee = 1000000

# Let's optimize it later.
latest_ledger = soroban_server.get_latest_ledger().sequence

op = tx.transaction.operations[0]
assert isinstance(op, InvokeHostFunction)
alice_authorization_entry: AuthorizationEntry = op.auth[0]
bob_authorization_entry: AuthorizationEntry = op.auth[1]

alice_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
alice_authorization_entry.sign(alice_kp, network_passphrase)

bob_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
bob_authorization_entry.sign(bob_kp, network_passphrase)

tx.sign(submitter_kp)
#print(f"Signed XDR:\n{tx.to_xdr()}")

send_transaction_data = soroban_server.send_transaction(tx)
#print(f"sent transaction: {send_transaction_data}")

while True:
    #print("waiting for transaction to be confirmed...")
    get_transaction_data = soroban_server.get_transaction(send_transaction_data.hash)
    if get_transaction_data.status != GetTransactionStatus.NOT_FOUND:
        break
    time.sleep(3)

#print(f"transaction: {get_transaction_data}")

if get_transaction_data.status == GetTransactionStatus.SUCCESS:
    assert get_transaction_data.result_meta_xdr is not None
    transaction_meta = stellar_xdr.TransactionMeta.from_xdr(
        get_transaction_data.result_meta_xdr
    )
    if transaction_meta.v3.soroban_meta.return_value.type == stellar_xdr.SCValType.SCV_VOID:  # type: ignore[union-attr]
        print("swap success")
