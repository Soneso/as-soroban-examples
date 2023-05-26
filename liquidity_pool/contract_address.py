"""Converts a contract id to address "C..."
"""
import binascii
import sys

from stellar_sdk import StrKey

result = StrKey.encode_contract(binascii.unhexlify(sys.argv[1]))
print(f"{result}")
