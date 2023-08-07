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
from stellar_sdk.soroban.types import Address, Int128, Vec

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

multi_swap_contract_addr = (
    sys.argv[1]
)

atomic_swap_addr = (
    sys.argv[2]
)

token_a_addr = (
    sys.argv[3]
)
token_b_addr = (
    sys.argv[4]
)


source = soroban_server.load_account(submitter_kp.public_key)

args = [
    Address(atomic_swap_addr),  # multi_swap_contract_id
    Address(token_a_addr),  # token_a
    Address(token_b_addr),  # token_b
    swapsSpecsA,
    swapsSpecsB
]

tx = (
    TransactionBuilder(source, network_passphrase)
    .add_time_bounds(0, 0)
    .append_invoke_contract_function_op(
        contract_id=multi_swap_contract_addr,
        function_name="multi_swap",
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
a1_authorization_entry: AuthorizationEntry = op.auth[0]
a2_authorization_entry: AuthorizationEntry = op.auth[1]
a3_authorization_entry: AuthorizationEntry = op.auth[2]
b1_authorization_entry: AuthorizationEntry = op.auth[3]
b2_authorization_entry: AuthorizationEntry = op.auth[4]
b3_authorization_entry: AuthorizationEntry = op.auth[5]

a1_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
a1_authorization_entry.sign(swapA1_kp, network_passphrase)

a2_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
a2_authorization_entry.sign(swapA2_kp, network_passphrase)

a3_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
a3_authorization_entry.sign(swapA3_kp, network_passphrase)

b1_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
b1_authorization_entry.sign(swapB1_kp, network_passphrase)

b2_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
b2_authorization_entry.sign(swapB2_kp, network_passphrase)

b3_authorization_entry.set_signature_expiration_ledger(latest_ledger + 3)
b3_authorization_entry.sign(swapB3_kp, network_passphrase)

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
