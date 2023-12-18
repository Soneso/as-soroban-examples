(module
 (type $i64_i64_i64_=>_i64 (func (param i64 i64 i64) (result i64)))
 (type $none_=>_i64 (func (result i64)))
 (type $i64_i64_i64_i64_=>_i64 (func (param i64 i64 i64 i64) (result i64)))
 (type $none_=>_none (func))
 (import "x" "7" (func $~lib/as-soroban-sdk/lib/env/get_current_contract_address (result i64)))
 (import "l" "3" (func $~lib/as-soroban-sdk/lib/env/create_contract (param i64 i64 i64) (result i64)))
 (import "d" "_" (func $~lib/as-soroban-sdk/lib/env/call (param i64 i64 i64) (result i64)))
 (memory $0 0)
 (export "deploy" (func $assembly/index/deploy))
 (export "memory" (memory $0))
 (export "sdkstart" (func $~start))
 (func $assembly/index/deploy (param $0 i64) (param $1 i64) (param $2 i64) (param $3 i64) (result i64)
  call $~lib/as-soroban-sdk/lib/env/get_current_contract_address
  local.get $0
  local.get $1
  call $~lib/as-soroban-sdk/lib/env/create_contract
  local.get $2
  local.get $3
  call $~lib/as-soroban-sdk/lib/env/call
 )
 (func $~start
  nop
 )
 ;; custom section "contractenvmetav0", size 12
 ;; custom section "contractspecv0", size 180
 ;; custom section "contractmetav0", size 148
)
