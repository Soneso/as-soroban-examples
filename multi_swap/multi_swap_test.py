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
from stellar_sdk.soroban.types import Address, Bytes, Int128, Vec

rpc_server_url = "https://rpc-futurenet.stellar.org:443/"
soroban_server = SorobanServer(rpc_server_url)
network_passphrase = Network.FUTURENET_NETWORK_PASSPHRASE

submitter_kp = Keypair.from_secret(
    "SBORMYR6J6IYKD3ZBJXWB6JQ4XLVTUC66QHU45262JQH4DSF22NFFWNM"
)  # GA5PTU7GGYXXC7CX5SAES3MQP34IHMOSZMRHHYU5GA6QIJETYU6JNE6Y

swapA1_kp = Keypair.from_secret(
    "SCVJOWNMFJLGM73HIJUC6H3NI6EULKIC3TZU5OQYYPDY6MKQK4N2VZB3"
)  # GBDVESQUNQZTQ67BS6RVATSIAGYNWNO6JQY4KA6V5WNSZ3KXSEWOCMCL
addressA1 = Address(swapA1_kp.public_key)
amountA1 = Int128(2000);
minRecvA1 = Int128(290);
swapSpecA1 = Vec([addressA1, amountA1, minRecvA1])

swapA2_kp = Keypair.from_secret(
    "SCF7GOOH2553X3KCNKCVMDZBJKHZ4ESDAG5DHTQMZFJ7ASFWPNFOC7EQ"
)  # GAX5T5KKYTXDRRRQHOQNEW2HUIFP6V52QYFUVII6TEKHJDLUXUJ3WW3J
addressA2 = Address(swapA2_kp.public_key)
amountA2 = Int128(3000);
minRecvA2 = Int128(350);
swapSpecA2 = Vec([addressA2, amountA2, minRecvA2])

swapA3_kp = Keypair.from_secret(
    "SCTTYYAKYDPNWN5BUHWLSLLK2DBXINFVPKE3QWPGAG2RR43DG2TCDOSP"
)  # GDB65H47NTZKRLOOU2GVHPHFWWTJEQDCYDZOUFAAADMN3W6NEBEAX62Z
addressA3 = Address(swapA3_kp.public_key)
amountA3 = Int128(4000);
minRecvA3 = Int128(301);
swapSpecA3 = Vec([addressA3, amountA3, minRecvA3])
swapsSpecsA = Vec([swapSpecA1, swapSpecA2, swapSpecA3])

swapB1_kp = Keypair.from_secret(
    "SDWZ5QGUDKT3OVB6LYOG4WAYWEE64BYO6WKPNPCDP5QPUZ2EPAQJJIZL"
)  # GCNTVAJRMHUZUNFTZOICCZUPZN64AU5BNHPITMEYLE5HZPM6IWUBLDI3
addressB1 = Address(swapB1_kp.public_key)
amountB1 = Int128(300);
minRecvB1 = Int128(2100);
swapSpecB1 = Vec([addressB1, amountB1, minRecvB1])

swapB2_kp = Keypair.from_secret(
    "SD7KH4UWQ3OLXUMHVVKJFWEPGD2225FD3FIRFBWHJDUCQB3ETGFODAO5"
)  # GAQ2SGHA46WT3LQO5XNDBVBCJEBCNQYLK7EKFB4SAP42Y6IBEI566DZZ
addressB2 = Address(swapB2_kp.public_key)
amountB2 = Int128(295);
minRecvB2 = Int128(1950);
swapSpecB2 = Vec([addressB2, amountB2, minRecvB2])

swapB3_kp = Keypair.from_secret(
    "SBCEJ5RKLEJYLCN4VI5K4SHBB7GWYYYP3AU2J4DMI4C3QHLL7B55LLZ2"
)  # GDXEWCCLZDQVXQR7HIKJ7JGHGZE6EF3DAJYHPGKM7IAMVS7O4MPVDDHF
addressB3 = Address(swapB3_kp.public_key)
amountB3 = Int128(400);
minRecvB3 = Int128(2900);
swapSpecB3 = Vec([addressB3, amountB3, minRecvB3])
swapsSpecsB = Vec([swapSpecB1, swapSpecB2, swapSpecB3])

multi_swap_contract_id = (
    sys.argv[1]
)

atomic_swap_contract_id = (
    sys.argv[2]
)
atomic_swap_address = Address.from_raw_contract(atomic_swap_contract_id);

token_a_contract_id = (
    sys.argv[3]
)
token_b_contract_id = (
    sys.argv[4]
)

bytesTokenA = Bytes(binascii.unhexlify(token_a_contract_id))
bytesTokenB = Bytes(binascii.unhexlify(token_b_contract_id))

source = soroban_server.load_account(submitter_kp.public_key)

args = [
    Bytes(binascii.unhexlify(atomic_swap_contract_id)),  # multi_swap_contract_id
    bytesTokenA,  # token_a
    bytesTokenB,  # token_b
    swapsSpecsA,
    swapsSpecsB
]

a1_nonce = soroban_server.get_nonce(atomic_swap_contract_id, swapA1_kp.public_key)
a2_nonce = soroban_server.get_nonce(atomic_swap_contract_id, swapA2_kp.public_key)
a3_nonce = soroban_server.get_nonce(atomic_swap_contract_id, swapA3_kp.public_key)

b1_nonce = soroban_server.get_nonce(atomic_swap_contract_id, swapB1_kp.public_key)
b2_nonce = soroban_server.get_nonce(atomic_swap_contract_id, swapB2_kp.public_key)
b3_nonce = soroban_server.get_nonce(atomic_swap_contract_id, swapB3_kp.public_key)

a1_root_invocation = AuthorizedInvocation(
    contract_id = atomic_swap_contract_id,
    function_name = "swap",
    args=[
        bytesTokenA,  # token_a
        bytesTokenB,  # token_b
        amountA1,  # amount_a
        minRecvA1,  # min_b_for_a
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id = token_a_contract_id,
            function_name = "incr_allow",
            args=[
                addressA1,  # owner
                atomic_swap_address,
                amountA1,
            ],
            sub_invocations=[],
        )
    ],
)

a2_root_invocation = AuthorizedInvocation(
    contract_id = atomic_swap_contract_id,
    function_name = "swap",
    args=[
        bytesTokenA,  # token_a
        bytesTokenB,  # token_b
        amountA2,  # amount_a
        minRecvA2,  # min_b_for_a
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id = token_a_contract_id,
            function_name = "incr_allow",
            args=[
                addressA2,  # owner
                atomic_swap_address,
                amountA2,
            ],
            sub_invocations=[],
        )
    ],
)

a3_root_invocation = AuthorizedInvocation(
    contract_id = atomic_swap_contract_id,
    function_name = "swap",
    args=[
        bytesTokenA,  # token_a
        bytesTokenB,  # token_b
        amountA3,  # amount_a
        minRecvA3,  # min_b_for_a
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id = token_a_contract_id,
            function_name = "incr_allow",
            args=[
                addressA3,  # owner
                atomic_swap_address,
                amountA3,
            ],
            sub_invocations=[],
        )
    ],
)

b1_root_invocation = AuthorizedInvocation(
    contract_id=atomic_swap_contract_id,
    function_name="swap",
    args=[
        bytesTokenB,  # token_b
        bytesTokenA,  # token_a
        amountB1,  # amount_b
        minRecvB1,  # min_a_for_b
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id=token_b_contract_id,
            function_name="incr_allow",
            args=[
                addressB1,  # owner
                atomic_swap_address,
                amountB1,
            ],
            sub_invocations=[],
        )
    ],
)

b2_root_invocation = AuthorizedInvocation(
    contract_id=atomic_swap_contract_id,
    function_name="swap",
    args=[
        bytesTokenB,  # token_b
        bytesTokenA,  # token_a
        amountB2,  # amount_b
        minRecvB2,  # min_a_for_b
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id=token_b_contract_id,
            function_name="incr_allow",
            args=[
                addressB2,  # owner
                atomic_swap_address,
                amountB2,
            ],
            sub_invocations=[],
        )
    ],
)

b3_root_invocation = AuthorizedInvocation(
    contract_id=atomic_swap_contract_id,
    function_name="swap",
    args=[
        bytesTokenB,  # token_b
        bytesTokenA,  # token_a
        amountB3,  # amount_b
        minRecvB3,  # min_a_for_b
    ],
    sub_invocations=[
        AuthorizedInvocation(
            contract_id=token_b_contract_id,
            function_name="incr_allow",
            args=[
                addressB3,  # owner
                atomic_swap_address,
                amountB3,
            ],
            sub_invocations=[],
        )
    ],
)

a1_contract_auth = ContractAuth(
    address=addressA1,
    nonce=a1_nonce,
    root_invocation=a1_root_invocation,
)
a1_contract_auth.sign(swapA1_kp, network_passphrase)

a2_contract_auth = ContractAuth(
    address=addressA2,
    nonce=a2_nonce,
    root_invocation=a2_root_invocation,
)
a2_contract_auth.sign(swapA2_kp, network_passphrase)

a3_contract_auth = ContractAuth(
    address=addressA3,
    nonce=a3_nonce,
    root_invocation=a3_root_invocation,
)
a3_contract_auth.sign(swapA3_kp, network_passphrase)


b1_contract_auth = ContractAuth(
    address=addressB1,
    nonce=b1_nonce,
    root_invocation=b1_root_invocation,
)
b1_contract_auth.sign(swapB1_kp, network_passphrase)

b2_contract_auth = ContractAuth(
    address=addressB2,
    nonce=b2_nonce,
    root_invocation=b2_root_invocation,
)
b2_contract_auth.sign(swapB2_kp, network_passphrase)

b3_contract_auth = ContractAuth(
    address=addressB3,
    nonce=b3_nonce,
    root_invocation=b3_root_invocation,
)
b3_contract_auth.sign(swapB3_kp, network_passphrase)


tx = (
    TransactionBuilder(source, network_passphrase)
    .add_time_bounds(0, 0)
    .append_invoke_contract_function_op(
        contract_id=multi_swap_contract_id,
        function_name="multi_swap",
        parameters=args,
        auth=[a1_contract_auth, a2_contract_auth, a3_contract_auth, b1_contract_auth, b2_contract_auth, b3_contract_auth],
    )
    .build()
)

simulate_transaction_data = soroban_server.simulate_transaction(tx)
print(f"simulated transaction: {simulate_transaction_data}")

print(f"setting footprint and signing transaction...")
assert simulate_transaction_data.results is not None
tx.set_footpoint(simulate_transaction_data.results[0].footprint)
tx.sign(submitter_kp)

print(f"Signed XDR:\n{tx.to_xdr()}")

send_transaction_data = soroban_server.send_transaction(tx)
print(f"sent transaction: {send_transaction_data}")

while True:
    print("waiting for transaction to be confirmed...")
    get_transaction_data = soroban_server.get_transaction(send_transaction_data.hash)
    if get_transaction_data.status != GetTransactionStatus.NOT_FOUND:
        break
    time.sleep(3)
print(f"transaction: {get_transaction_data}")

if get_transaction_data.status == GetTransactionStatus.SUCCESS:
    assert get_transaction_data.result_meta_xdr is not None
    transaction_meta = stellar_xdr.TransactionMeta.from_xdr(
        get_transaction_data.result_meta_xdr
    )
    result = transaction_meta.v3.tx_result.result.results[0].tr.invoke_host_function_result.success  # type: ignore
    print(f"Function result: {result}")
