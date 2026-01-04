/**
 * Interfaces for Convex clients
 *
 * These interfaces define the public contracts for Convex clients, enabling:
 * - Type-safe dependency injection
 * - Test fakes/mocks that implement the same contract
 * - Alternative client implementations
 *
 * Architecture:
 * - Granular interfaces (MutationClient, QueryClient, ActionClient) for ISP
 * - SharedConvexClientInterface: Composed from granular interfaces + connection/auth
 * - ConvexClientInterface: Extends shared with onUpdate() for push-based subscriptions (Svelte)
 * - ConvexReactClientInterface: Extends shared with watchQuery() for pull-based subscriptions (React)
 *
 * @public
 */

import type { ArgsAndOptions, FunctionArgs, FunctionReference, FunctionReturnType } from "../server/index.js";
import type { ConnectionState, AuthTokenFetcher } from "./sync/client.js";
import type { Unsubscribe } from "./simple_client.js";
import type { QueryJournal } from "./sync/protocol.js";
import type { PaginationStatus } from "./index.js";
import type { LoadMoreOfPaginatedQuery } from "./sync/pagination.js";
import type { Value } from "../values/index.js";
import type { Logger } from "./logging.js";

// Re-export granular interfaces for convenience
export type { MutationClient, QueryClient, ActionClient } from "../client/interfaces.js";
import type { MutationClient, QueryClient, ActionClient } from "../client/interfaces.js";

/**
 * Shared interface for high-level Convex client implementations.
 *
 * Composed from granular interfaces (MutationClient, QueryClient, ActionClient)
 * plus connection and authentication capabilities.
 *
 * Use the extended interfaces (ConvexClientInterface, ConvexReactClientInterface)
 * for the full contract including subscription methods.
 *
 * Note: This is different from BaseConvexClientInterface which is for the
 * low-level BaseConvexClient (string-based APIs, used internally).
 *
 * @public
 */
export interface SharedConvexClientInterface
  extends MutationClient,
    QueryClient,
    ActionClient {
  /**
   * Whether the client has been closed.
   */
  readonly closed: boolean;

  /**
   * Get the current connection state.
   */
  connectionState(): ConnectionState;

  /**
   * Subscribe to connection state changes.
   *
   * @param callback - Callback when connection state changes
   * @returns Unsubscribe function
   */
  subscribeToConnectionState(
    callback: (connectionState: ConnectionState) => void,
  ): () => void;

  /**
   * Set authentication for subsequent requests.
   *
   * @param fetchToken - Function to fetch the auth token
   * @param onChange - Optional callback when auth status changes
   */
  setAuth(
    fetchToken: AuthTokenFetcher,
    onChange?: (isAuthenticated: boolean) => void,
  ): void;

  /**
   * Close the client and clean up resources.
   */
  close(): Promise<void>;
}

/**
 * Minimal interface for accessing local query results.
 *
 * Exposed via ConvexClientInterface.client for frameworks like convex-svelte
 * that need synchronous access to cached query results.
 *
 * @public
 */
export interface LocalQueryResultClient {
  /**
   * Get a query result from local cache.
   *
   * @param name - The function name (e.g., "messages:list")
   * @param args - The query arguments
   * @returns The cached result or undefined if not available
   */
  localQueryResult(name: string, args?: Record<string, Value>): Value | undefined;
}

/**
 * Interface for ConvexClient (push-based subscriptions).
 *
 * Used by convex-svelte and other frameworks that prefer callback-based subscriptions
 * where the query result is pushed to the callback.
 *
 * @public
 */
export interface ConvexClientInterface extends SharedConvexClientInterface {
  /**
   * Whether the client is disabled (e.g., for server-side rendering).
   */
  readonly disabled: boolean;

  /**
   * Access to the underlying client for synchronous query result access.
   *
   * Used by frameworks like convex-svelte that need to read cached results
   * synchronously (e.g., for SSR hydration or optimistic updates).
   */
  readonly client: LocalQueryResultClient;

  /**
   * Subscribe to a query with callbacks for updates and errors.
   *
   * @param query - The query function reference
   * @param args - The query arguments
   * @param callback - Callback when query result updates (receives the result)
   * @param onError - Optional callback when an error occurs
   * @returns Unsubscribe function to stop the subscription
   */
  onUpdate<Query extends FunctionReference<"query">>(
    query: Query,
    args: FunctionArgs<Query>,
    callback: (result: FunctionReturnType<Query>) => unknown,
    onError?: (e: Error) => unknown,
  ): Unsubscribe<Query["_returnType"]>;
}

/**
 * A watch on the output of a Convex query function.
 *
 * @public
 */
export interface Watch<T> {
  /**
   * Subscribe to be notified when the query result changes.
   *
   * The callback is invoked without arguments - call localQueryResult()
   * to get the actual result.
   *
   * @param callback - Function called when the query result changes
   * @returns Unsubscribe function
   */
  onUpdate(callback: () => void): () => void;

  /**
   * Get the current result of the query synchronously.
   *
   * @returns The result, or undefined if not yet loaded
   * @throws Error if the query encountered a server error
   */
  localQueryResult(): T | undefined;

  /**
   * Get the current journal for pagination.
   */
  journal(): QueryJournal | undefined;
}

/**
 * Options for watchQuery.
 *
 * @public
 */
export interface WatchQueryOptions {
  /**
   * An optional journal from a previous execution for pagination.
   */
  journal?: QueryJournal;
}

/**
 * A watch on the output of a paginated Convex query function.
 *
 * @public
 */
export interface PaginatedWatch<T> {
  /**
   * Subscribe to be notified when the paginated query result changes.
   *
   * @param callback - Function called when the query result changes
   * @returns Unsubscribe function
   */
  onUpdate(callback: () => void): () => void;

  /**
   * Get the current result of the paginated query synchronously.
   *
   * @returns The results, status, and loadMore function, or undefined if not yet loaded
   */
  localQueryResult():
    | {
        results: T[];
        status: PaginationStatus;
        loadMore: LoadMoreOfPaginatedQuery;
      }
    | undefined;
}

/**
 * Options for watchPaginatedQuery.
 *
 * @public
 */
export interface WatchPaginatedQueryOptions {
  /**
   * The initial number of items to load.
   */
  initialNumItems: number;
}

/**
 * Interface for ConvexReactClient (pull-based subscriptions).
 *
 * Used by convex/react where subscriptions notify without data,
 * and the result is pulled via localQueryResult().
 *
 * @public
 */
export interface ConvexReactClientInterface extends SharedConvexClientInterface {
  /**
   * Get the logger for this client.
   */
  readonly logger: Logger;

  /**
   * Subscribe to a query and get a Watch object for managing the subscription.
   *
   * @param query - The query function reference
   * @param argsAndOptions - The query arguments and optional watch options
   * @returns A Watch object with onUpdate() and localQueryResult() methods
   */
  watchQuery<Query extends FunctionReference<"query">>(
    query: Query,
    ...argsAndOptions: ArgsAndOptions<Query, WatchQueryOptions>
  ): Watch<FunctionReturnType<Query>>;

  /**
   * Subscribe to a paginated query and get a PaginatedWatch object.
   *
   * @param query - The paginated query function reference
   * @param argsAndOptions - The query arguments and pagination options
   * @returns A PaginatedWatch object with onUpdate() and localQueryResult() methods
   */
  watchPaginatedQuery<Query extends FunctionReference<"query">>(
    query: Query,
    ...argsAndOptions: ArgsAndOptions<Query, WatchPaginatedQueryOptions>
  ): PaginatedWatch<FunctionReturnType<Query>>;
}
