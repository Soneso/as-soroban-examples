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
from stellar_sdk.soroban.soroban_rpc import TransactionStatus
from stellar_sdk.soroban.types import Address, Bytes, Int128

rpc_server_url = "https://horizon-futurenet.stellar.cash:443/soroban/rpc"
soroban_server = SorobanServer(rpc_server_url)
network_passphrase = Network.FUTURENET_NETWORK_PASSPHRASE

submitter_kp = Keypair.from_secret(
    "SAIQXSLSJVPNTKQUS6UNCFTSXAYMTYGLS6RI6HHV2CO4AML6KLJY3RIO"
)  # GBDKMWFNRCQFTFF4U4I2XAKRYP3PZPCWHQ7BZUEOAUMCBYNAMIEEG7QM
alice_kp = Keypair.from_secret(
    "SASL5DBNIBTVCY4DX75FD64RCOPQVCAM554Y52HE7EUK4UQSS67HZRQ5"
)  # GDOB7QSQYA4PWJ3VFE5XO2OCOG54Y5CKXMYCJZBIJPT33M2PWHLGXD5O
bob_kp = Keypair.from_secret(
    "SAHNHTFMFXOM4VME5VYDH7GMNCQS4PGNSJ6KFBE7UDR5446TSYRH6QHW"
)  # GDM6DOD3MHD36YTNYWECJAP4NKHYJGLN2XZOUENO3YQU5NLXDWVVLAMB
atomic_swap_contract_id = (
    sys.argv[1]
)
token_a_contract_id = (
    "3c656d421338a1b89a2cc96a651bccfff4314b74c8a57828518e408fe266c6d7"
)
token_b_contract_id = (
    "3e7a8bf9c5df350cc73eb77033308dd23ce710bed9bfe60710f5c702b3363e59"
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
            function_name="incr_allow",
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
            function_name="incr_allow",
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
    get_transaction_status_data = soroban_server.get_transaction_status(
        send_transaction_data.id
    )
    if get_transaction_status_data.status != TransactionStatus.PENDING:
        break
    time.sleep(3)
# print(f"transaction status: {get_transaction_status_data}")

if get_transaction_status_data.status == TransactionStatus.SUCCESS:
    result = stellar_xdr.SCVal.from_xdr(get_transaction_status_data.results[0].xdr)  # type: ignore
    print(f"transaction result: {result}")
