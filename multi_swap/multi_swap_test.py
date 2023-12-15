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
    Address,
)
import stellar_sdk.xdr as stellar_xdr
from stellar_sdk.auth import authorize_entry
from stellar_sdk.exceptions import PrepareTransactionException
from stellar_sdk.soroban_rpc import GetTransactionStatus, SendTransactionStatus

#rpc_server_url = "https://soroban-testnet.stellar.org"
#soroban_server = SorobanServer(rpc_server_url)
#network_passphrase = Network.TESTNET_NETWORK_PASSPHRASE

rpc_server_url = "https://rpc-futurenet.stellar.org"
soroban_server = SorobanServer(rpc_server_url)
network_passphrase = 'Test SDF Future Network ; October 2022'

submitter_kp = Keypair.from_secret(
    "SA4VZPUHRLEOPEPH5EDFHELYRUNRVHITYMX7MB5WFDCAEOPPCQVOEKYV"
)  # GDNGXPMCVH5ZQUBWINCFFP4F2SEV3NFNFYCUZBZPIQA5QQPV2CJWUP7G

swapA1_kp = Keypair.from_secret(
    "SC2J4NEFL4LN5NESIWGYK32LW7EIG2AJNCNQWZWMBOWA4VWM2FS2OYUM"
)  # GBTZCGVLGSOZ2JO3WDZSPBC7W5K4HED5IPVE5M55GVKNSAUGDFD3JI4P
addressA1 = scval.to_address(swapA1_kp.public_key)
amountA1 = scval.to_int128(2000);
minRecvA1 = scval.to_int128(290);
swapSpecA1 = scval.to_vec([addressA1, amountA1, minRecvA1])

swapA2_kp = Keypair.from_secret(
    "SCOJMJS56KZKEZOCQ3QAJEAVMFAD34633U3S4E6FB3DA5HOU536FWU2I"
)  # GB46L53KCLXZK7TBN7Y3T2C7AYU3UD4YSII6DZ7XP7XEHRKDPSTMVDXT
addressA2 = scval.to_address(swapA2_kp.public_key)
amountA2 = scval.to_int128(3000);
minRecvA2 = scval.to_int128(350);
swapSpecA2 = scval.to_vec([addressA2, amountA2, minRecvA2])

swapA3_kp = Keypair.from_secret(
    "SBL444JTWY2CZAIEVN33GQY3IY3SZDJIIMKBFNVOYPGPHRU7PCZSJKXV"
)  # GBV22NUGMH4REN23ICZWAEWWVST62WAOQZHWJVCPYYOAOUPQ4MT4PH62
addressA3 = scval.to_address(swapA3_kp.public_key)
amountA3 = scval.to_int128(4000);
minRecvA3 = scval.to_int128(301);
swapSpecA3 = scval.to_vec([addressA3, amountA3, minRecvA3])
swapsSpecsA = scval.to_vec([swapSpecA1, swapSpecA2, swapSpecA3])

swapB1_kp = Keypair.from_secret(
    "SDOANUUYDF3QUAMVBBGUFVBN2GPHLGNFXUIK4QRZLDCUB7NTVT776CMP"
)  # GCR3NBOPV7VDYMDSXYJ67N6YNOF2QETKT6QSP24KKVPW6ZQO2S3GJHUR
addressB1 = scval.to_address(swapB1_kp.public_key)
amountB1 = scval.to_int128(300);
minRecvB1 = scval.to_int128(2100);
swapSpecB1 = scval.to_vec([addressB1, amountB1, minRecvB1])

swapB2_kp = Keypair.from_secret(
    "SDNBRDOU4ZEDZXDXTM2UOIDW74FNGOIR6VDPEAZDASDKMFDN27U267MB"
)  # GC32YYRYT3MPDQCNVHRB4ZWIOHL7L42VCJATE2ZU75Q7XESOWSDSJ7WU
addressB2 = scval.to_address(swapB2_kp.public_key)
amountB2 = scval.to_int128(295);
minRecvB2 = scval.to_int128(1950);
swapSpecB2 = scval.to_vec([addressB2, amountB2, minRecvB2])

swapB3_kp = Keypair.from_secret(
    "SA4CNSQFXFJCRVY3Z44RNJGCIPF2RRHCBMDE3QQDAOMLVYTBLHYSFB3W"
)  # GDLTA3L4B7FPVV24RHTKP2RQGQREU4YAEF5XFPPRVS2RRLHMXLFI7AOP
addressB3 = scval.to_address(swapB3_kp.public_key)
amountB3 = scval.to_int128(400);
minRecvB3 = scval.to_int128(2900);
swapSpecB3 = scval.to_vec([addressB3, amountB3, minRecvB3])
swapsSpecsB = scval.to_vec([swapSpecB1, swapSpecB2, swapSpecB3])

multi_swap_contract_addr = (
    #"CAIDIG5MHK7BDWWIHE6MXDAQ67KTJYSA4RHVXSAVEVZWCIE2HC7VA3IW"
    sys.argv[1]
)

atomic_swap_addr = (
    #"CA644K453SCTRTMKXL6XONNPQGHH2T55T7U2RCYDAMZOZEZMWU6ZPP4P"
    sys.argv[2]
)

token_a_addr = (
    #"CBTFR6DH755MIUVHD7EGKTYJ7WUFJ4CRYFFU5M2AGY3T23KUNJYJ47BG"
    sys.argv[3]
)
token_b_addr = (
    #"CD3UXYKN36MXU3HRCX4TYY74EEESPAZK6ERXMIHVHFNSWC7Q6PRDSSM5"
    sys.argv[4]
)


source = soroban_server.load_account(submitter_kp.public_key)

args = [
    scval.to_address(atomic_swap_addr),  # atomic_swap_contract_id
    scval.to_address(token_a_addr),  # token_a
    scval.to_address(token_b_addr),  # token_b
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

try:
    simulate_resp = soroban_server.simulate_transaction(tx)
    # You need to check the error in the response,
    # if the error is not None, you need to handle it.
    # print(f"Auth RES: {simulate_resp.results[0].auth}")
    op = tx.transaction.operations[0]
    assert isinstance(op, InvokeHostFunction)
    assert simulate_resp.results is not None
    assert simulate_resp.results[0].auth is not None
    auths = simulate_resp.results[0].auth
    op_auth = []
    
    for auth in auths:
       xdr = stellar_xdr.SorobanAuthorizationEntry.from_xdr(auth)
       sig_kp = swapA1_kp
       sc_address = Address.from_xdr_sc_address(xdr.credentials.address.address)
       if sc_address.address == swapA2_kp.public_key:
           sig_kp = swapA2_kp
       elif sc_address.address == swapA3_kp.public_key:
           sig_kp = swapA3_kp
       elif sc_address.address == swapB1_kp.public_key:
           sig_kp = swapB1_kp
       elif sc_address.address == swapB2_kp.public_key:
           sig_kp = swapB2_kp
       elif sc_address.address == swapB3_kp.public_key:
           sig_kp = swapB3_kp
           
       op_auth.append(authorize_entry(
            auth,
            sig_kp,
            simulate_resp.latest_ledger + 20,
            network_passphrase,
        ))
       
    op.auth = op_auth
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
    print("waiting for transaction to be confirmed...")
    get_transaction_data = soroban_server.get_transaction(send_transaction_data.hash)
    if get_transaction_data.status != GetTransactionStatus.NOT_FOUND:
        break
    time.sleep(3)

# print(f"transaction: {get_transaction_data}")

if get_transaction_data.status == GetTransactionStatus.SUCCESS:
    print("multi swap success")
else:
    print(f"Transaction failed: {get_transaction_data.result_xdr}")
