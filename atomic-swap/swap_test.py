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
    "SBORMYR6J6IYKD3ZBJXWB6JQ4XLVTUC66QHU45262JQH4DSF22NFFWNM"
)  # GA5PTU7GGYXXC7CX5SAES3MQP34IHMOSZMRHHYU5GA6QIJETYU6JNE6Y
alice_kp = Keypair.from_secret(
    "SCVJOWNMFJLGM73HIJUC6H3NI6EULKIC3TZU5OQYYPDY6MKQK4N2VZB3"
)  # GBDVESQUNQZTQ67BS6RVATSIAGYNWNO6JQY4KA6V5WNSZ3KXSEWOCMCL
bob_kp = Keypair.from_secret(
    "SDWZ5QGUDKT3OVB6LYOG4WAYWEE64BYO6WKPNPCDP5QPUZ2EPAQJJIZL"
)  # GCNTVAJRMHUZUNFTZOICCZUPZN64AU5BNHPITMEYLE5HZPM6IWUBLDI3
atomic_swap_contract_id = (
    sys.argv[1]
)
token_a_contract_id = (
    "721934fe4e1a90e2119e6ca71a71d4661bcf6c96f28fc05476bd7965e4e30006"
)
token_b_contract_id = (
    "1ffecc2bd64667a400c53e71a9a134d3db245b32472f9e14c9de12d1a0609c63"
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

simulate_transaction_data = soroban_server.simulate_transaction(tx)
# print(f"simulated transaction: {simulate_transaction_data}")

# print(f"setting footprint and signing transaction...")
assert simulate_transaction_data.results is not None
tx.set_footpoint(simulate_transaction_data.results[0].footprint)
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
