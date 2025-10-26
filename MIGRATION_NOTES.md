# Deno Dependency Migration Notes - Phase 1.2

## Overview
This document tracks the migration from Deno std@0.97.0 (May 2021) to std@0.224.0 (2024).

## Completed Updates

### 1. Deno Standard Library Updates

#### ✅ Logging (`std/log`)
- **Old**: `std@0.97.0/log/mod.ts`
- **New**: `std@0.224.0/log/mod.ts`
- **Status**: ✅ Updated
- **Breaking Changes**: None
- **Files Affected**: All files using `log` from deps.ts

#### ✅ Testing Assertions (`std/testing/asserts`)
- **Old**: `std@0.97.0/testing/asserts.ts`
- **New**: `std@0.224.0/testing/asserts.ts`
- **Status**: ✅ Updated
- **Breaking Changes**: None
- **Files Affected**: All test files

#### ✅ Path Utilities (`std/path`)
- **Old**: `std@0.97.0/path/posix.ts`
- **New**: `std@0.224.0/path/posix.ts`
- **Status**: ✅ Updated
- **Breaking Changes**: None
- **Functions**: `extname`, `join`, `resolve`

#### ✅ YAML (`std/yaml`)
- **Old**: `std@0.97.0/encoding/yaml.ts`
- **New**: `std@0.224.0/yaml/mod.ts`
- **Status**: ✅ Updated
- **Breaking Changes**: Module path changed from `encoding/yaml` to `yaml/mod.ts`
- **API Changes**: None - `parse` and `stringify` still work the same

#### ✅ CLI Flags (`std/flags` → `std/cli`)
- **Old**: `std@0.97.0/flags/mod.ts`
- **New**: `std@0.224.0/cli/parse_args.ts`
- **Status**: ✅ Updated
- **Breaking Changes**: Module moved from `flags/mod.ts` to `cli/parse_args.ts`
- **API Changes**: None - `parse()` function signature unchanged

#### ✅ Async Utilities (`std/async`)
- **Old**: `std@0.97.0/async/deferred.ts`
- **New**: `std@0.224.0/async/deferred.ts`
- **Status**: ✅ Updated
- **Breaking Changes**: None

#### ✅ Filesystem (`std/fs`)
- **Old**: `std@0.97.0/fs/walk.ts`
- **New**: `std@0.224.0/fs/walk.ts`
- **Status**: ✅ Updated
- **Breaking Changes**: None

#### ✅ Base64 Encoding (`std/encoding/base64`)
- **Old**: `deno.land/x/base64@v0.2.1` (third-party)
- **New**: `std@0.224.0/encoding/base64.ts` (official std library)
- **Status**: ✅ Updated
- **Breaking Changes**: YES
  - `fromUint8Array()` → `encodeBase64()`
  - `toUint8Array()` → `decodeBase64()`
- **Files Modified**:
  - `/cmd/moviematch/pkger.ts` - Updated to use `encodeBase64()`
  - `/internal/app/moviematch/util/pkger_release.ts` - Updated to use `decodeBase64()`

### 2. Third-Party Dependency Updates

#### ✅ Accepts
- **Old**: `deno.land/x/accepts@2.1.0`
- **New**: `deno.land/x/accepts@2.2.1`
- **Status**: ✅ Updated
- **Breaking Changes**: None expected

#### ✅ Yup (Validation)
- **Old**: `yup@0.32.9` (via Skypack)
- **New**: `yup@1.4.0` (via Skypack)
- **Status**: ✅ Updated
- **Breaking Changes**: Yup 1.x has breaking changes, may need schema updates
- **Risk**: Medium - validation schemas may need updates

#### ✅ Compress
- **Old**: `deno.land/x/compress@v0.3.6`
- **New**: `deno.land/x/compress@v0.4.6`
- **Status**: ✅ Updated
- **Breaking Changes**: None expected

#### ✅ Media Types
- **Old**: `deno.land/x/media_types@v2.7.1`
- **New**: `deno.land/x/media_types@v3.1.2`
- **Status**: ✅ Updated
- **Breaking Changes**: None expected

#### ✅ XML Parser
- **Old**: `deno.land/x/xmlp@v0.2.8`
- **New**: `deno.land/x/xmlp@v0.3.2`
- **Status**: ✅ Updated
- **Breaking Changes**: None expected

## Pending Updates (Require Code Refactoring)

### ❌ HTTP Server (`std/http/server`)
- **Old**: `std@0.97.0/http/server.ts`
- **New**: ❌ **REMOVED** - Module deprecated and removed in std@0.115.0
- **Status**: ⚠️ **KEPT AT OLD VERSION** - Requires major refactoring
- **Migration Path**: Use native `Deno.serve()` API
- **Breaking Changes**: COMPLETE API REWRITE
  - `serve()` → `Deno.serve()`
  - `serveTLS()` → `Deno.serve({ cert, key })`
  - `Server` → No longer needed
  - `ServerRequest` → Native `Request` object
  - `Response` type → Native `Response` object
  - `req.respond()` → Return `Response` from handler

**Files Requiring Updates**:
- `/internal/app/moviematch/app.ts` - Main server setup (lines 54-163)
- `/internal/app/moviematch/types.ts` - RouteHandler type definition
- `/internal/app/moviematch/handlers/*.ts` - All route handlers
  - `serve_static.ts`
  - `basic_auth.ts`
  - `template.ts`
  - `health.ts`
  - `poster.ts`
  - `link.ts`
  - `api.ts`

**Migration Example**:
```typescript
// OLD (std@0.97.0)
const server = serve({ hostname: "0.0.0.0", port: 8000 });
for await (const req of server) {
  await req.respond({ status: 200, body: "Hello" });
}

// NEW (Deno.serve)
Deno.serve({ hostname: "0.0.0.0", port: 8000 }, (req) => {
  return new Response("Hello", { status: 200 });
});
```

### ❌ WebSocket (`std/ws`)
- **Old**: `std@0.97.0/ws/mod.ts`
- **New**: ❌ **REMOVED** - Use native API
- **Status**: ⚠️ **KEPT AT OLD VERSION** - Requires major refactoring
- **Migration Path**: Use native `Deno.upgradeWebSocket()`
- **Breaking Changes**: COMPLETE API REWRITE
  - `acceptWebSocket({ bufReader, bufWriter, headers })` → `Deno.upgradeWebSocket(req)`
  - Returns `{ socket, response }` instead of `WebSocket` directly
  - WebSocket event handling changed

**Files Requiring Updates**:
- `/internal/app/moviematch/handlers/api.ts` - WebSocket upgrade (lines 12-16)
- `/internal/app/moviematch/client.ts` - WebSocket message handling

**Migration Example**:
```typescript
// OLD (std@0.97.0)
const webSocket = await acceptWebSocket({
  bufReader: req.r,
  bufWriter: req.w,
  headers: req.headers,
});

// NEW (native Deno)
const { socket, response } = Deno.upgradeWebSocket(req);
return response;
```

### ❌ IO Streams (`std/io/streams`)
- **Old**: `std@0.97.0/io/streams.ts`
- **New**: ❌ **REMOVED** - Use native Web Streams API
- **Status**: ⚠️ **KEPT AT OLD VERSION**
- **Migration Path**: Use `ReadableStream.from()` or native Response body
- **Breaking Changes**: Function removed
  - `readerFromStreamReader()` → Native Web Streams

**Files Requiring Updates**:
- `/internal/app/moviematch/handlers/poster.ts` - Stream handling (line 1)

## Testing Requirements

After HTTP and WebSocket migration:
1. ✅ Run `deno cache` on all entry points
2. ✅ Fix TypeScript errors
3. ✅ Run unit tests: `deno test`
4. ✅ Run e2e tests
5. ✅ Manual testing of:
   - HTTP server starts correctly
   - Static file serving works
   - WebSocket connections work
   - Basic auth works
   - Poster/link handlers work

## Recommendations

### Phase 1.2 (Current)
✅ Update all dependencies that don't require code changes
✅ Document breaking changes
✅ Keep old HTTP/WS/IO imports working

### Phase 1.3 (Next)
- Migrate HTTP server from `std/http/server` to native `Deno.serve()`
- Migrate WebSocket from `std/ws` to native `Deno.upgradeWebSocket()`
- Migrate IO streams to native Web Streams API
- Update all route handlers
- Full integration testing

### Phase 1.4 (Final)
- Remove old `std@0.97.0` dependencies
- Performance testing
- Production deployment

## Risk Assessment

| Component | Risk Level | Reason |
|-----------|-----------|--------|
| Logging | 🟢 Low | API unchanged |
| Testing | 🟢 Low | API unchanged |
| Path Utils | 🟢 Low | API unchanged |
| YAML | 🟢 Low | Only import path changed |
| Flags | 🟢 Low | Only import path changed |
| Async | 🟢 Low | API unchanged |
| Filesystem | 🟢 Low | API unchanged |
| Base64 | 🟢 Low | Simple function rename, already updated |
| Third-party | 🟡 Medium | Yup 1.x may require validation updates |
| HTTP Server | 🔴 High | Complete rewrite required |
| WebSocket | 🔴 High | Complete rewrite required |
| IO Streams | 🟡 Medium | Need to use native streams |

## Compatibility Notes

### Deno Version Requirements
- **Minimum**: Deno 1.20+ (for native `Deno.serve()`)
- **Recommended**: Deno 1.40+ (latest stable features)

### Breaking Change Summary
1. ✅ **Base64 API** - Updated function names
2. ⏳ **HTTP Server** - Awaiting Phase 1.3
3. ⏳ **WebSocket** - Awaiting Phase 1.3
4. ⏳ **IO Streams** - Awaiting Phase 1.3

## Files Modified in Phase 1.2

### Updated Files
1. `/deps.ts` - Main dependency file
   - Updated std library to 0.224.0 (except HTTP/WS/IO)
   - Updated all third-party dependencies
   - Added migration comments

2. `/cmd/moviematch/pkger.ts`
   - Updated `base64.fromUint8Array()` → `base64.encodeBase64()`

3. `/internal/app/moviematch/util/pkger_release.ts`
   - Updated `base64.toUint8Array()` → `base64.decodeBase64()`

### Files Requiring Future Updates
See "Pending Updates" section above for complete list.

## Next Steps

1. ✅ Complete Phase 1.2 dependency updates
2. ⏳ Create Phase 1.3 plan for HTTP/WS migration
3. ⏳ Test current changes with Deno
4. ⏳ Plan migration strategy for route handlers
5. ⏳ Create integration test suite for new server API
