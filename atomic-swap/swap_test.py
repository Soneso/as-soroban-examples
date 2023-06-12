"""This test invokes a given atomic swap contract to swap two tokens.

See https://soroban.stellar.org/docs/how-to-guides/atomic-swap
https://soroban.stellar.org/docs/learn/authorization
"""
import binascii
import time
import sys

from stellar_sdk import Network, Keypair, TransactionBuilder
from stellar_sdk import xdr as stellar_xdr
from stellar_sdk.soroban import AuthorizedInvocation, ContractAuth, SorobanServer
from stellar_sdk.soroban.soroban_rpc import GetTransactionStatus
from stellar_sdk.soroban.types import Address, Bytes, Int128

rpc_server_url = "https://rpc-futurenet.stellar.org:443/"
soroban_server = SorobanServer(rpc_server_url)
network_passphrase = Network.FUTURENET_NETWORK_PASSPHRASE

submitter_kp = Keypair.from_secret(
    "SAQVVIROUM6R7USECNPTYDJR4RQH4PJN64TQED6GV6ZZWU54HW476UDG"
)  # GBOKVCPQDINAJCQY7EA7EH7YADMHTU5RH7LSK3YMQ2IRPGVQOM42ZBRD
alice_kp = Keypair.from_secret(
    "SCOD3C7T454JBJZRK5X4YA4YC7MHG6NN3J5SEDOOPN2HHFVMBAZZG4JA"
)  # GD6NH26Z4NPK3TYDG3VZBRHXHYYOEMYDXHTXOP6EIHO56SRZWLIC7QET
bob_kp = Keypair.from_secret(
    "SAJNWYJFYSFKCZHPZGC7FTZP7TXXV2NWL6G7EN4RB2IQMFTIG4HIIHZQ"
)  # GCO4TV6P23OJTFW2ZZZ3RTYUFBQFTSAA6CZKJRYKWIODZNYKKROVBQVC
atomic_swap_contract_id = (
    sys.argv[1]
)
token_a_contract_id = (
    "c3bd6a005f72c317aacdb9476f49a61b23dc432ac1fd843b35d989ab295d0e0b"
)
token_b_contract_id = (
    "2f307e3282a3a5d78d5f2343d8744d26b80686b1a211fb8d7ad3630b2c23d3d4"
)

source = soroban_server.load_account(submitter_kp.public_key)

args = [
    Address(alice_kp.public_key),  # a
    Address(bob_kp.public_key),  # b
    Bytes(binascii.unhexlify(token_a_contract_id)),  # token_a
    Bytes(binascii.unhexlify(token_b_contract_id)),  # token_b
    Int128(1000),  # amount_a
    Int128(4500),  # min_b_for_a
    Int128(5000),  # amount_b
    Int128(950),  # min_a_for_b
]

alice_nonce = soroban_server.get_nonce(atomic_swap_contract_id, alice_kp.public_key)
bob_nonce = soroban_server.get_nonce(atomic_swap_contract_id, bob_kp.public_key)

alice_root_invocation = AuthorizedInvocation(
    contract_id=atomic_swap_contract_id,
    function_name="swap",
    args=[
        Bytes(binascii.unhexlify(token_a_contract_id)),  # token_a
        Bytes(binascii.unhexlify(token_b_contract_id)),  # token_b
        Int128(1000),  # amount_a
        Int128(4500),  # min_b_for_a
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id=token_a_contract_id,
            function_name="increase_allowance",
            args=[
                Address(alice_kp.public_key),  # owner
                Address.from_raw_contract(atomic_swap_contract_id),
                Int128(1000),
            ],
            sub_invocations=[],
        )
    ],
)

bob_root_invocation = AuthorizedInvocation(
    contract_id=atomic_swap_contract_id,
    function_name="swap",
    args=[
        Bytes(binascii.unhexlify(token_b_contract_id)),  # token_b
        Bytes(binascii.unhexlify(token_a_contract_id)),  # token_a
        Int128(5000),  # amount_b
        Int128(950),  # min_a_for_b
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id=token_b_contract_id,
            function_name="increase_allowance",
            args=[
                Address(bob_kp.public_key),  # owner
                Address.from_raw_contract(atomic_swap_contract_id),
                Int128(5000),
            ],
            sub_invocations=[],
        )
    ],
)

alice_contract_auth = ContractAuth(
    address=Address(alice_kp.public_key),
    nonce=alice_nonce,
    root_invocation=alice_root_invocation,
)
alice_contract_auth.sign(alice_kp, network_passphrase)
bob_contract_auth = ContractAuth(
    address=Address(bob_kp.public_key),
    nonce=bob_nonce,
    root_invocation=bob_root_invocation,
)
bob_contract_auth.sign(bob_kp, network_passphrase)

tx = (
    TransactionBuilder(source, network_passphrase)
    .add_time_bounds(0, 0)
    .append_invoke_contract_function_op(
        contract_id=atomic_swap_contract_id,
        function_name="swap",
        parameters=args,
        auth=[alice_contract_auth, bob_contract_auth],
    )
    .build()
)

tx = soroban_server.prepare_transaction(tx)
tx.sign(submitter_kp)

# print(f"Signed XDR:\n{tx.to_xdr()}")

send_transaction_data = soroban_server.send_transaction(tx)
# print(f"sent transaction: {send_transaction_data}")

while True:
    # print("waiting for transaction to be confirmed...")
    get_transaction_data = soroban_server.get_transaction(send_transaction_data.hash)
    if get_transaction_data.status != GetTransactionStatus.NOT_FOUND:
        break
    time.sleep(3)
# print(f"transaction: {get_transaction_data}")

if get_transaction_data.status == GetTransactionStatus.SUCCESS:
    assert get_transaction_data.result_meta_xdr is not None
    transaction_meta = stellar_xdr.TransactionMeta.from_xdr(
        get_transaction_data.result_meta_xdr
    )
    result = transaction_meta.v3.tx_result.result.results[0].tr.invoke_host_function_result.success  # type: ignore
    print(f"Function result: {result}")
