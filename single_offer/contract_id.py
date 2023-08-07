"""Converts a contract address "C..." to a contract id
"""
import binascii
import sys

from stellar_sdk import StrKey

result = binascii.hexlify(StrKey.decode_contract(sys.argv[1])).decode()
print(f"{result}")
