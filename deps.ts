// Type re-exports
// NOTE: Response and ServerRequest from old std/http are deprecated
// These are kept for backwards compatibility during migration
// TODO: Migrate to native Deno.serve() API
// NOTE: deferred was removed in std@0.224.0, using 0.204.0 for compatibility
// Migration path: Use native Promise.withResolvers() when available
export type { Deferred } from "https://deno.land/std@0.204.0/async/deferred.ts";

// Deno std dependencies
// NOTE: std/http/server.ts was removed in std@0.115.0
// The old serve() API is deprecated. Keeping imports commented for reference.
// export {
//   serve,
//   Server,
//   ServerRequest,
//   serveTLS,
// } from "https://deno.land/std@0.97.0/http/server.ts";
//
// Migration path: Use native Deno.serve() instead
// See: https://deno.land/api?s=Deno.serve

// For now, we keep the old std@0.97.0 HTTP imports until server code is refactored
export {
  serve,
  Server,
  ServerRequest,
  serveTLS,
} from "https://deno.land/std@0.97.0/http/server.ts";
export type { Response } from "https://deno.land/std@0.97.0/http/server.ts";

// Logging - updated to latest
export * as log from "https://deno.land/std@0.224.0/log/mod.ts";
export { ConsoleHandler, LogRecord } from "https://deno.land/std@0.224.0/log/mod.ts";

// Testing - updated to latest
export {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/testing/asserts.ts";

// WebSocket - old API deprecated, keeping for now
// NOTE: acceptWebSocket from std/ws is deprecated
// Migration path: Use native Deno.upgradeWebSocket() instead
export { acceptWebSocket } from "https://deno.land/std@0.97.0/ws/mod.ts";
export type { WebSocket } from "https://deno.land/std@0.97.0/ws/mod.ts";

// Path utilities - updated to latest
export {
  extname,
  join as joinPath,
  resolve as resolvePath,
} from "https://deno.land/std@0.224.0/path/mod.ts";

// YAML - updated to latest
export {
  parse as parseYaml,
  stringify as stringifyYaml,
} from "https://deno.land/std@0.224.0/yaml/mod.ts";

// CLI flags - updated to latest
export { parseArgs as parseFlags } from "https://deno.land/std@0.224.0/cli/mod.ts";

// Async utilities - deferred removed in std@0.224.0, using 0.204.0
export { deferred } from "https://deno.land/std@0.204.0/async/deferred.ts";

// IO streams - removed in latest std
// NOTE: readerFromStreamReader was removed from std/io
// Migration path: Use native ReadableStream.from() or new Response(stream).body
// Keeping old import for now
export { readerFromStreamReader } from "https://deno.land/std@0.97.0/io/streams.ts";

// Filesystem - updated to latest
export { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

// Third-party dependencies
// Accepts - updated to latest version
export { Accepts } from "https://deno.land/x/accepts@2.1.1/mod.ts";

// Yup - updated to latest version
// @deno-types="https://cdn.skypack.dev/yup@1.4.0?dts"
export * as yup from "https://cdn.skypack.dev/yup@1.4.0";

// Base64 - using std library instead of third-party
// NOTE: std/encoding/base64 is now the recommended approach
export * as base64 from "https://deno.land/std@0.224.0/encoding/base64.ts";

// Compress - updated to latest version
export { gzip } from "https://deno.land/x/compress@v0.4.6/mod.ts";

// Media types - updated to JSR @std/media-types (Deno 2.0 compatible)
export { typeByExtension as lookupMimeType } from "jsr:@std/media-types";

// XML Parser - updated to latest version
export {
  ElementInfo,
  PullParser as XMLPullParser,
} from "https://deno.land/x/xmlp@v0.3.0/mod.ts";
