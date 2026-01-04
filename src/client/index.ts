/**
 * Client Interfaces for Convex
 *
 * This module provides type-safe interfaces for Convex clients, enabling:
 * - Dependency injection for testing
 * - Interface Segregation (depend only on what you need)
 * - Framework-agnostic client contracts
 *
 * @module
 */

import type { ArgsAndOptions, FunctionArgs, FunctionReference, FunctionReturnType } from "../server/index.js";
import type { ConnectionState, AuthTokenFetcher, MutationOptions } from "../browser/sync/client.js";
import type { Unsubscribe } from "../browser/simple_client.js";
import type { QueryJournal } from "../browser/sync/protocol.js";
import type { PaginationStatus } from "../browser/index.js";
import type { LoadMoreOfPaginatedQuery } from "../browser/sync/pagination.js";
import type { Value } from "../values/index.js";
import type { Logger } from "../browser/logging.js";

// =============================================================================
// Granular Interfaces (Interface Segregation Principle)
// =============================================================================

/**
 * Client capable of executing mutations.
 *
 * Use this interface when your code only needs to call mutations,
 * rather than depending on the full ConvexClientInterface.
 *
 * @example
 * ```ts
 * function createTodoService(client: MutationClient) {
 *   return {
 *     add: (title: string) => client.mutation(api.todos.create, { title }),
 *   };
 * }
 * ```
 *
 * @public
 */
export interface MutationClient {
  mutation<Mutation extends FunctionReference<"mutation">>(
    mutation: Mutation,
    ...argsAndOptions: ArgsAndOptions<Mutation, MutationOptions>
  ): Promise<Awaited<FunctionReturnType<Mutation>>>;
}

/**
 * Client capable of executing one-shot queries.
 *
 * Use this interface when your code only needs to fetch query results once,
 * rather than subscribing to live updates.
 *
 * @public
 */
export interface QueryClient {
  query<Query extends FunctionReference<"query">>(
    query: Query,
    ...argsAndOptions: ArgsAndOptions<Query, Record<string, never>>
  ): Promise<Awaited<Query["_returnType"]>>;
}

/**
 * Client capable of executing actions.
 *
 * Use this interface when your code only needs to call actions.
 *
 * @public
 */
export interface ActionClient {
  action<Action extends FunctionReference<"action">>(
    action: Action,
    ...argsAndOptions: ArgsAndOptions<Action, Record<string, never>>
  ): Promise<Awaited<FunctionReturnType<Action>>>;
}

// =============================================================================
// Composed Interfaces
// =============================================================================

/**
 * Shared interface for high-level Convex client implementations.
 *
 * Composed from granular interfaces (MutationClient, QueryClient, ActionClient)
 * plus connection and authentication capabilities.
 *
 * Use the extended interfaces (ConvexClientInterface, ConvexReactClientInterface)
 * for the full contract including subscription methods.
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

// =============================================================================
// Watch Interfaces (for React-style pull-based subscriptions)
// =============================================================================

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
