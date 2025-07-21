"""This test invokes a given atomic swap contract to swap two tokens.

See https://soroban.stellar.org/docs/how-to-guides/atomic-swap
https://soroban.stellar.org/docs/learn/authorization
"""

import time
import sys

from stellar_sdk import (
    InvokeHostFunction,
    Keypair,
    Network,
    SorobanServer,
    TransactionBuilder,
    scval,
)
import stellar_sdk.xdr as stellar_xdr
from stellar_sdk.auth import authorize_entry
from stellar_sdk.exceptions import PrepareTransactionException
from stellar_sdk.soroban_rpc import GetTransactionStatus, SendTransactionStatus

rpc_server_url = "https://soroban-testnet.stellar.org"
soroban_server = SorobanServer(rpc_server_url)
network_passphrase = Network.TESTNET_NETWORK_PASSPHRASE

submitter_kp = Keypair.from_secret(
    "SB7AFWVRFJ4UGTB6X4LSHXOWQY6ZV6JNQYTNCXRC2ILYLDHEQCKLVDEF"
)
alice_kp = Keypair.from_secret(
    "SB7H2FO7WV7XSMHC6S44UN4D2HD42QTXV3XJ2X6E6KUUV5ZF5VVWMCYD"
)
bob_kp = Keypair.from_secret(
    "SAHV2UIGNJ6TT4NXQ2U65A2DGP723YLKRS3TQFHFY3ZDFFQUAXBYIFEH"
)
atomic_swap_contract_id = (sys.argv[1])
token_a_contract_id = "CC7NYY7UIUMCMVM65JQL2T3KP6EDFOIK3TL3DQQIHYDNY2XJOQZJI7W7"
token_b_contract_id = "CBW3JCXJVJWJYSRJCHYPLVSW7E4SY6ONNSNUIVNQT4FEVAFTXT4N46YT"


source = soroban_server.load_account(submitter_kp.public_key)

args = [
    scval.to_address(alice_kp.public_key),  # a
    scval.to_address(bob_kp.public_key),  # b
    scval.to_address(token_a_contract_id),  # token_a
    scval.to_address(token_b_contract_id),  # token_b
    scval.to_int128(1000),  # amount_a
    scval.to_int128(4500),  # min_b_for_a
    scval.to_int128(5000),  # amount_b
    scval.to_int128(950),  # min_a_for_b
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

try:
    simulate_resp = soroban_server.simulate_transaction(tx)
    # You need to check the error in the response,
    # if the error is not None, you need to handle it.
    op = tx.transaction.operations[0]
    assert isinstance(op, InvokeHostFunction)
    assert simulate_resp.results is not None
    assert simulate_resp.results[0].auth is not None
    op.auth = [
        authorize_entry(
            simulate_resp.results[0].auth[0],
            alice_kp,
            simulate_resp.latest_ledger + 20,
            network_passphrase,
        ),  # alice sign the entry
        authorize_entry(
            simulate_resp.results[0].auth[1],
            bob_kp,
            simulate_resp.latest_ledger + 20,
            network_passphrase,
        ),  # bob sign the entry
    ]
    tx = soroban_server.prepare_transaction(tx, simulate_resp)
except PrepareTransactionException as e:
    print(f"Got exception: {e.simulate_transaction_response}")
    raise e

tx.sign(submitter_kp)
# print(f"Signed XDR:\n{tx.to_xdr()}")


send_transaction_data = soroban_server.send_transaction(tx)

if send_transaction_data.status != SendTransactionStatus.PENDING:
    print(f"sent transaction: {send_transaction_data}")
    raise Exception("send transaction failed")

while True:
    # print("waiting for transaction to be confirmed...")
    get_transaction_data = soroban_server.get_transaction(send_transaction_data.hash)
    if get_transaction_data.status != GetTransactionStatus.NOT_FOUND:
        break
    time.sleep(3)

# print(f"transaction: {get_transaction_data}")

if get_transaction_data.status == GetTransactionStatus.SUCCESS:
    print("swap success")
else:
    print(f"Transaction failed: {get_transaction_data.result_xdr}")
