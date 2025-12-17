/**
 * Interface for BaseConvexClient
 *
 * This interface defines the public contract for BaseConvexClient, enabling:
 * - Dependency injection into ConvexClient for testing
 * - Type-safe mocks and fakes
 * - Alternative implementations
 *
 * @public
 */

import type { Value } from "../../values/index.js";
import type { QueryJournal } from "./protocol.js";
import type { QueryToken } from "./udf_path_utils.js";
import type { AuthTokenFetcher } from "./authentication_manager.js";

/**
 * Connection state between the client and Convex backend.
 * @public
 */
export interface ConnectionState {
  /** Whether there are mutations or actions still being processed */
  hasInflightRequests: boolean;
  /** Whether the WebSocket is currently connected */
  isWebSocketConnected: boolean;
  /** Whether the client has ever successfully connected */
  hasEverConnected: boolean;
  /** Number of times the WebSocket has connected */
  connectionCount: number;
  /** Number of reconnection attempts since last successful connection */
  connectionRetries: number;
  /** Timestamp of the oldest in-flight request, if any */
  timeOfOldestInflightRequest: Date | null;
  /** Number of in-flight mutations */
  inflightMutations: number;
  /** Number of in-flight actions */
  inflightActions: number;
}

/**
 * Options for subscribing to a query.
 * @public
 */
export interface SubscribeOptions {
  /** Query journal for resuming subscriptions */
  journal?: QueryJournal;
  /** Component path for component queries */
  componentPath?: string;
}

/**
 * Options for executing a mutation.
 * @public
 */
export interface MutationOptions {
  /** Optimistic update function */
  optimisticUpdate?: (localStore: OptimisticLocalStore) => void;
}

/**
 * Local store for optimistic updates.
 * @public
 */
export interface OptimisticLocalStore {
  getQuery<T>(query: unknown, args: Record<string, unknown>): T | undefined;
  setQuery(query: unknown, args: Record<string, unknown>, value: unknown): void;
}

/**
 * Interface for the low-level Convex client.
 *
 * BaseConvexClient implements this interface. Test fakes and alternative
 * implementations should implement this interface for compatibility with
 * ConvexClient when using dependency injection.
 *
 * @public
 */
export interface BaseConvexClientInterface {
  /**
   * Subscribe to a query function.
   *
   * @param name - The name of the query
   * @param args - Query arguments
   * @param options - Subscribe options
   * @returns Object with queryToken and unsubscribe function
   */
  subscribe(
    name: string,
    args?: Record<string, Value>,
    options?: SubscribeOptions,
  ): { queryToken: QueryToken; unsubscribe: () => void };

  /**
   * Get a query result from local cache by name and args.
   *
   * @param name - The query name
   * @param args - Query arguments
   * @returns The cached result or undefined
   */
  localQueryResult(name: string, args?: Record<string, Value>): Value | undefined;

  /**
   * Get a query result from local cache by token.
   * @internal
   */
  localQueryResultByToken(queryToken: QueryToken): Value | undefined;

  /**
   * Check if a query result exists in local cache.
   * @internal
   */
  hasLocalQueryResultByToken(queryToken: QueryToken): boolean;

  /**
   * Get query logs by name and args.
   * @internal
   */
  localQueryLogs(name: string, args?: Record<string, Value>): string[] | undefined;

  /**
   * Get the query journal for a query.
   */
  queryJournal(name: string, args?: Record<string, Value>): QueryJournal | undefined;

  /**
   * Execute a mutation.
   *
   * @param name - The mutation name
   * @param args - Mutation arguments
   * @param options - Mutation options (e.g., optimistic updates)
   * @returns Promise resolving to the mutation result
   */
  mutation(
    name: string,
    args?: Record<string, Value>,
    options?: MutationOptions,
  ): Promise<any>;

  /**
   * Execute an action.
   *
   * @param name - The action name
   * @param args - Action arguments
   * @returns Promise resolving to the action result
   */
  action(name: string, args?: Record<string, Value>): Promise<any>;

  /**
   * Get the current connection state.
   */
  connectionState(): ConnectionState;

  /**
   * Subscribe to connection state changes.
   *
   * @param callback - Called when connection state changes
   * @returns Unsubscribe function
   */
  subscribeToConnectionState(
    callback: (connectionState: ConnectionState) => void,
  ): () => void;

  /**
   * Set authentication for subsequent requests.
   *
   * @param fetchToken - Function to fetch the auth token
   * @param onChange - Callback when auth status changes
   */
  setAuth(
    fetchToken: AuthTokenFetcher,
    onChange: (isAuthenticated: boolean) => void,
  ): void;

  /**
   * Clear authentication.
   */
  clearAuth(): void;

  /**
   * Check if authentication is set.
   */
  hasAuth(): boolean;

  /**
   * Get the current auth token and decoded claims.
   */
  getCurrentAuthClaims(): { token: string; decoded: Record<string, any> } | undefined;

  /**
   * Close the client and clean up resources.
   */
  close(): Promise<void>;

  /**
   * The URL address of the Convex deployment.
   */
  readonly url: string;
}
