/**
 * Granular Client Interfaces (Interface Segregation Principle)
 *
 * These fine-grained interfaces allow consumers to depend only on the
 * capabilities they need, enabling:
 * - Better testability (smaller interfaces to mock)
 * - Clearer contracts (explicit dependencies)
 * - Flexibility (mix and match capabilities)
 *
 * The larger interfaces (SharedConvexClientInterface, ConvexClientInterface)
 * are composed from these granular interfaces.
 *
 * @public
 */

import type { ArgsAndOptions, FunctionReference, FunctionReturnType } from "../server/index.js";
import type { MutationOptions } from "../browser/sync/client.js";

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
