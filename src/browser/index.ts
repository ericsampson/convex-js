/**
 * Tools for accessing Convex in the browser.
 *
 * **If you are using React, use the {@link react} module instead.**
 *
 * ## Usage
 *
 * Create a {@link ConvexHttpClient} to connect to the Convex Cloud.
 *
 * ```typescript
 * import { ConvexHttpClient } from "convex/browser";
 * // typically loaded from an environment variable
 * const address = "https://small-mouse-123.convex.cloud";
 * const convex = new ConvexHttpClient(address);
 * ```
 *
 * @module
 */
export { BaseConvexClient } from "./sync/client.js";
export type {
  BaseConvexClientOptions,
  MutationOptions,
  SubscribeOptions,
  ConnectionState,
  AuthTokenFetcher,
} from "./sync/client.js";
export type { BaseConvexClientInterface } from "./sync/base_client_interface.js";
export type { PaginationStatus, LoadMoreOfPaginatedQuery } from "./sync/pagination.js";
export type { ConvexClientOptions, Unsubscribe } from "./simple_client.js";
export { ConvexClient } from "./simple_client.js";
export type {
  // Granular interfaces (ISP)
  MutationClient,
  QueryClient,
  ActionClient,
  // Composed interfaces
  SharedConvexClientInterface,
  ConvexClientInterface,
  ConvexReactClientInterface,
  LocalQueryResultClient,
  Watch,
  WatchQueryOptions,
  PaginatedWatch,
  WatchPaginatedQueryOptions,
} from "./client_interface.js";
export type {
  OptimisticUpdate,
  OptimisticLocalStore,
} from "./sync/optimistic_updates.js";
export type { QueryToken } from "./sync/udf_path_utils.js";
/** @internal */
export type { PaginatedQueryToken } from "./sync/udf_path_utils.js";
export { ConvexHttpClient } from "./http_client.js";
export type { HttpMutationOptions } from "./http_client.js";
export type { QueryJournal } from "./sync/protocol.js";
/** @internal */
export type { UserIdentityAttributes } from "./sync/protocol.js";
export type { FunctionResult } from "./sync/function_result.js";
export type { Logger } from "./logging.js";
