(module
 (type $none_=>_i64 (func (result i64)))
 (type $i64_i64_=>_i64 (func (param i64 i64) (result i64)))
 (type $i64_i64_i64_=>_i64 (func (param i64 i64 i64) (result i64)))
 (type $i64_=>_i64 (func (param i64) (result i64)))
 (type $none_=>_none (func))
 (import "x" "7" (func $~lib/as-soroban-sdk/lib/env/get_current_contract_address (result i64)))
 (import "b" "4" (func $~lib/as-soroban-sdk/lib/env/bytes_new (result i64)))
 (import "b" "9" (func $~lib/as-soroban-sdk/lib/env/bytes_push (param i64 i64) (result i64)))
 (import "l" "3" (func $~lib/as-soroban-sdk/lib/env/create_contract (param i64 i64 i64) (result i64)))
 (import "v" "_" (func $~lib/as-soroban-sdk/lib/env/vec_new (result i64)))
 (import "v" "6" (func $~lib/as-soroban-sdk/lib/env/vec_push_back (param i64 i64) (result i64)))
 (import "x" "5" (func $~lib/as-soroban-sdk/lib/env/fail_with_error (param i64) (result i64)))
 (import "d" "_" (func $~lib/as-soroban-sdk/lib/env/call (param i64 i64 i64) (result i64)))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $~started (mut i32) (i32.const 0))
 (memory $0 1)
 (data (i32.const 1036) "<")
 (data (i32.const 1048) "\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data (i32.const 1100) "<")
 (data (i32.const 1112) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s")
 (data (i32.const 1164) "\1c")
 (data (i32.const 1176) "\02\00\00\00\06\00\00\00a\00d\00d")
 (export "deploy2" (func $assembly/index2/deploy2))
 (export "memory" (memory $0))
 (export "sdkstart" (func $~start))
 (func $assembly/index2/deploy2 (param $0 i64) (result i64)
  (local $1 i32)
  (local $2 i32)
  (local $3 i64)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i64)
  call $~lib/as-soroban-sdk/lib/env/get_current_contract_address
  local.set $3
  global.get $~lib/rt/stub/offset
  local.tee $4
  i32.const 4
  i32.add
  local.tee $5
  i32.const 28
  i32.add
  local.tee $6
  memory.size $0
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
   local.get $6
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
   memory.grow $0
   i32.const 0
   i32.lt_s
   if
    local.get $8
    memory.grow $0
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $6
  global.set $~lib/rt/stub/offset
  local.get $4
  i32.const 28
  i32.store $0
  local.get $5
  i32.const 4
  i32.sub
  local.tee $4
  i32.const 0
  i32.store $0 offset=4
  local.get $4
  i32.const 0
  i32.store $0 offset=8
  local.get $4
  i32.const 4
  i32.store $0 offset=12
  local.get $4
  i32.const 8
  i32.store $0 offset=16
  local.get $5
  i64.const 0
  i64.store $0 offset=16
  local.get $5
  local.get $0
  i64.store $0 offset=16
  call $~lib/as-soroban-sdk/lib/env/bytes_new
  local.set $0
  global.get $~lib/rt/stub/offset
  local.tee $4
  i32.const 4
  i32.add
  local.tee $6
  i32.const 28
  i32.add
  local.tee $7
  memory.size $0
  local.tee $8
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $9
  i32.gt_u
  if
   local.get $8
   local.get $7
   local.get $9
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $9
   local.get $8
   local.get $9
   i32.gt_s
   select
   memory.grow $0
   i32.const 0
   i32.lt_s
   if
    local.get $9
    memory.grow $0
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $7
  global.set $~lib/rt/stub/offset
  local.get $4
  i32.const 28
  i32.store $0
  local.get $6
  i32.const 4
  i32.sub
  local.tee $4
  i32.const 0
  i32.store $0 offset=4
  local.get $4
  i32.const 0
  i32.store $0 offset=8
  local.get $4
  i32.const 4
  i32.store $0 offset=12
  local.get $4
  i32.const 8
  i32.store $0 offset=16
  local.get $6
  i64.const 0
  i64.store $0 offset=16
  local.get $6
  local.get $0
  i64.store $0 offset=16
  loop $for-loop|0
   local.get $2
   i32.const 32
   i32.lt_u
   if
    local.get $6
    local.get $6
    i64.load $0 offset=16
    local.get $2
    i64.extend_i32_u
    i64.const 32
    i64.shl
    i64.const 4
    i64.or
    call $~lib/as-soroban-sdk/lib/env/bytes_push
    i64.store $0 offset=16
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|0
   end
  end
  local.get $3
  local.get $5
  i64.load $0 offset=16
  local.get $6
  i64.load $0 offset=16
  call $~lib/as-soroban-sdk/lib/env/create_contract
  local.set $3
  call $~lib/as-soroban-sdk/lib/env/vec_new
  local.set $0
  global.get $~lib/rt/stub/offset
  local.tee $2
  i32.const 4
  i32.add
  local.tee $4
  i32.const 28
  i32.add
  local.tee $5
  memory.size $0
  local.tee $6
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $7
  i32.gt_u
  if
   local.get $6
   local.get $5
   local.get $7
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $7
   local.get $6
   local.get $7
   i32.gt_s
   select
   memory.grow $0
   i32.const 0
   i32.lt_s
   if
    local.get $7
    memory.grow $0
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
  i32.store $0
  local.get $4
  i32.const 4
  i32.sub
  local.tee $2
  i32.const 0
  i32.store $0 offset=4
  local.get $2
  i32.const 0
  i32.store $0 offset=8
  local.get $2
  i32.const 5
  i32.store $0 offset=12
  local.get $2
  i32.const 8
  i32.store $0 offset=16
  local.get $4
  i64.const 0
  i64.store $0 offset=16
  local.get $4
  local.get $0
  i64.store $0 offset=16
  local.get $4
  local.get $4
  i64.load $0 offset=16
  i64.const 30064771077
  call $~lib/as-soroban-sdk/lib/env/vec_push_back
  i64.store $0 offset=16
  local.get $4
  local.get $4
  i64.load $0 offset=16
  i64.const 12884901893
  call $~lib/as-soroban-sdk/lib/env/vec_push_back
  i64.store $0 offset=16
  i64.const 0
  local.set $0
  i32.const 1180
  i32.load $0
  i32.const 1
  i32.shr_u
  i32.const 9
  i32.gt_u
  if
   i64.const 3
   call $~lib/as-soroban-sdk/lib/env/fail_with_error
   drop
  end
  loop $for-loop|00
   local.get $1
   i32.const 1180
   i32.load $0
   i32.const 1
   i32.shr_u
   i32.lt_s
   if
    local.get $1
    i32.const 1180
    i32.load $0
    i32.const 1
    i32.shr_u
    i32.ge_u
    if (result i32)
     i32.const -1
    else
     local.get $1
     i32.const 1
     i32.shl
     i32.const 1184
     i32.add
     i32.load16_u $0
    end
    local.tee $2
    i32.const 122
    i32.le_s
    local.get $2
    i32.const 48
    i32.ge_s
    i32.and
    if
     local.get $0
     i64.const 6
     i64.shl
     local.set $10
     i64.const 0
     local.set $0
     local.get $2
     i32.const 255
     i32.and
     i32.const 95
     i32.eq
     if
      i64.const 1
      local.set $0
     else
      local.get $2
      i32.const 255
      i32.and
      local.tee $5
      i32.const 57
      i32.le_u
      local.get $5
      i32.const 48
      i32.ge_u
      i32.and
      if
       local.get $2
       i32.const 255
       i32.and
       i64.extend_i32_u
       i64.const 46
       i64.sub
       local.set $0
      else
       local.get $2
       i32.const 255
       i32.and
       local.tee $5
       i32.const 90
       i32.le_u
       local.get $5
       i32.const 65
       i32.ge_u
       i32.and
       if
        local.get $2
        i32.const 255
        i32.and
        i64.extend_i32_u
        i64.const 53
        i64.sub
        local.set $0
       else
        local.get $2
        i32.const 255
        i32.and
        local.tee $5
        i32.const 122
        i32.le_u
        local.get $5
        i32.const 97
        i32.ge_u
        i32.and
        if
         local.get $2
         i32.const 255
         i32.and
         i64.extend_i32_u
         i64.const 59
         i64.sub
         local.set $0
        else
         i64.const 3
         call $~lib/as-soroban-sdk/lib/env/fail_with_error
         drop
        end
       end
      end
     end
     local.get $0
     local.get $10
     i64.or
     local.set $0
    else
     i64.const 3
     call $~lib/as-soroban-sdk/lib/env/fail_with_error
     drop
    end
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|00
   end
  end
  local.get $3
  local.get $0
  i64.const 8
  i64.shl
  i64.const 14
  i64.or
  local.get $4
  i64.load $0 offset=16
  call $~lib/as-soroban-sdk/lib/env/call
 )
 (func $~start
  global.get $~started
  if
   return
  end
  i32.const 1
  global.set $~started
  i32.const 1196
  global.set $~lib/rt/stub/offset
 )
 ;; custom section "contractenvmetav0", size 12
 ;; custom section "contractspecv0", size 180
 ;; custom section "contractmetav0", size 148
)
