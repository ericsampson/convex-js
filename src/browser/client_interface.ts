/**
 * Interface for ConvexClient
 *
 * This interface defines the public contract for ConvexClient, enabling:
 * - Type-safe dependency injection
 * - Test fakes/mocks that implement the same contract
 * - Alternative client implementations
 *
 * @public
 */

import type { FunctionArgs, FunctionReference, FunctionReturnType } from "../server/index.js";
import type { ConnectionState, AuthTokenFetcher } from "./sync/client.js";
import type { MutationOptions } from "./sync/client.js";
import type { Unsubscribe } from "./simple_client.js";

/**
 * Interface for Convex client implementations.
 *
 * ConvexClient implements this interface. Test fakes and alternative
 * implementations should also implement this interface to ensure
 * compatibility with code that depends on ConvexClient.
 *
 * @public
 */
export interface ConvexClientInterface {
  /**
   * Whether the client is disabled (e.g., for server-side rendering).
   */
  readonly disabled: boolean;

  /**
   * Whether the client has been closed.
   */
  readonly closed: boolean;

  /**
   * Subscribe to a query with callbacks for updates and errors.
   *
   * @param query - The query function reference
   * @param args - The query arguments
   * @param callback - Callback when query result updates
   * @param onError - Optional callback when an error occurs
   * @returns Unsubscribe function to stop the subscription
   */
  onUpdate<Query extends FunctionReference<"query">>(
    query: Query,
    args: FunctionArgs<Query>,
    callback: (result: FunctionReturnType<Query>) => unknown,
    onError?: (e: Error) => unknown,
  ): Unsubscribe<Query["_returnType"]>;

  /**
   * Execute a mutation function.
   *
   * @param mutation - The mutation function reference
   * @param args - The mutation arguments
   * @param options - Optional mutation options (e.g., optimistic updates)
   * @returns Promise resolving to the mutation result
   */
  mutation<Mutation extends FunctionReference<"mutation">>(
    mutation: Mutation,
    args: FunctionArgs<Mutation>,
    options?: MutationOptions,
  ): Promise<Awaited<FunctionReturnType<Mutation>>>;

  /**
   * Execute an action function.
   *
   * @param action - The action function reference
   * @param args - The action arguments
   * @returns Promise resolving to the action result
   */
  action<Action extends FunctionReference<"action">>(
    action: Action,
    args: FunctionArgs<Action>,
  ): Promise<Awaited<FunctionReturnType<Action>>>;

  /**
   * Fetch a query result once.
   *
   * @param query - The query function reference
   * @param args - The query arguments
   * @returns Promise resolving to the query result
   */
  query<Query extends FunctionReference<"query">>(
    query: Query,
    args: Query["_args"],
  ): Promise<Awaited<Query["_returnType"]>>;

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
