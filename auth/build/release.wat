(module
 (type $i64_=>_i64 (func (param i64) (result i64)))
 (type $i64_i64_=>_i64 (func (param i64 i64) (result i64)))
 (type $i32_i64_=>_i64 (func (param i32 i64) (result i64)))
 (type $i64_=>_i32 (func (param i64) (result i32)))
 (type $none_=>_i64 (func (result i64)))
 (type $i64_i64_i64_=>_i64 (func (param i64 i64 i64) (result i64)))
 (type $none_=>_none (func))
 (import "l" "0" (func $~lib/as-soroban-sdk/lib/ledger/has_contract_data (param i64) (result i64)))
 (import "x" "8" (func $~lib/as-soroban-sdk/lib/context/fail_with_status (param i64) (result i64)))
 (import "l" "1" (func $~lib/as-soroban-sdk/lib/ledger/get_contract_data (param i64) (result i64)))
 (import "l" "_" (func $~lib/as-soroban-sdk/lib/ledger/put_contract_data (param i64 i64) (result i64)))
 (import "m" "_" (func $~lib/as-soroban-sdk/lib/map/map_new (result i64)))
 (import "m" "0" (func $~lib/as-soroban-sdk/lib/map/map_put (param i64 i64 i64) (result i64)))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $~started (mut i32) (i32.const 0))
 (memory $0 1)
 (data (i32.const 1036) "<")
 (data (i32.const 1048) "\01\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data (i32.const 1100) "<")
 (data (i32.const 1112) "\01\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s")
 (export "auth" (func $assembly/index/auth))
 (export "memory" (memory $0))
 (export "sdkstart" (func $~start))
 (func $~lib/as-soroban-sdk/lib/value/addTagToBody (param $0 i32) (param $1 i64) (result i64)
  local.get $0
  i32.const 255
  i32.and
  i32.const 8
  i32.lt_u
  local.get $1
  i64.const 1152921504606846976
  i64.lt_u
  i32.and
  i32.eqz
  if
   i32.const 6
   i64.const 8
   call $~lib/as-soroban-sdk/lib/value/addTagToBody
   call $~lib/as-soroban-sdk/lib/context/fail_with_status
   drop
  end
  local.get $0
  i32.const 1
  i32.shl
  i32.const 255
  i32.and
  i64.extend_i32_u
  local.get $1
  i64.const 4
  i64.shl
  i64.or
  i64.const 1
  i64.or
 )
 (func $~lib/as-soroban-sdk/lib/value/toU32 (param $0 i64) (result i32)
  i64.const 1
  local.get $0
  i64.const 1
  i64.shr_u
  i64.const 7
  i64.and
  local.get $0
  i64.const 1
  i64.and
  i64.eqz
  select
  i64.eqz
  i32.eqz
  if
   i32.const 6
   i64.const 8
   call $~lib/as-soroban-sdk/lib/value/addTagToBody
   call $~lib/as-soroban-sdk/lib/context/fail_with_status
   drop
  end
  local.get $0
  i64.const 4
  i64.shr_u
  i32.wrap_i64
 )
 (func $assembly/index/auth (param $0 i64) (param $1 i64) (result i64)
  (local $2 i32)
  (local $3 i64)
  (local $4 i32)
  (local $5 i32)
  (local $6 i64)
  (local $7 i32)
  (local $8 i32)
  i32.const 0
  local.get $0
  call $~lib/as-soroban-sdk/lib/ledger/has_contract_data
  local.tee $3
  i64.const 1
  i64.shr_u
  i64.const 7
  i64.and
  i32.wrap_i64
  i32.const 2
  i32.eq
  local.get $3
  i64.const 1
  i64.and
  i64.eqz
  select
  if (result i32)
   local.get $3
   i64.const 4
   i64.shr_u
   local.tee $6
   i64.const 2
   i64.eq
   local.get $6
   i64.const 1
   i64.eq
   i32.or
  else
   i32.const 0
  end
  i32.eqz
  if
   i32.const 6
   i64.const 8
   call $~lib/as-soroban-sdk/lib/value/addTagToBody
   call $~lib/as-soroban-sdk/lib/context/fail_with_status
   drop
  end
  local.get $3
  i64.const 4
  i64.shr_u
  i64.const 1
  i64.eq
  if (result i32)
   local.get $0
   call $~lib/as-soroban-sdk/lib/ledger/get_contract_data
   call $~lib/as-soroban-sdk/lib/value/toU32
  else
   i32.const 0
  end
  local.set $2
  local.get $0
  i32.const 0
  local.get $1
  call $~lib/as-soroban-sdk/lib/value/toU32
  local.get $2
  i32.add
  i64.extend_i32_u
  call $~lib/as-soroban-sdk/lib/value/addTagToBody
  local.tee $1
  call $~lib/as-soroban-sdk/lib/ledger/put_contract_data
  drop
  call $~lib/as-soroban-sdk/lib/map/map_new
  local.set $3
  global.get $~lib/rt/stub/offset
  local.tee $2
  i32.const 4
  i32.add
  local.tee $4
  i32.const 28
  i32.add
  local.tee $5
  memory.size
  local.tee $7
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $8
  i32.gt_u
  if
   local.get $7
   local.get $5
   local.get $8
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $8
   local.get $7
   local.get $8
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $8
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $5
  global.set $~lib/rt/stub/offset
  local.get $2
  i32.const 28
  i32.store
  local.get $4
  i32.const 4
  i32.sub
  local.tee $2
  i32.const 0
  i32.store offset=4
  local.get $2
  i32.const 0
  i32.store offset=8
  local.get $2
  i32.const 3
  i32.store offset=12
  local.get $2
  i32.const 8
  i32.store offset=16
  local.get $4
  i64.const 0
  i64.store offset=16
  local.get $4
  local.get $3
  i64.store offset=16
  local.get $4
  local.get $4
  i64.load offset=16
  local.get $0
  local.get $1
  call $~lib/as-soroban-sdk/lib/map/map_put
  i64.store offset=16
  local.get $4
  i64.load offset=16
 )
 (func $~start
  global.get $~started
  if
   return
  end
  i32.const 1
  global.set $~started
  i32.const 1164
  global.set $~lib/rt/stub/offset
 )
 ;; custom section "contractenvmetav0", size 12
 ;; custom section "contractspecv0", size 72
)
