/**
 * Client interfaces re-exported from convex/client for backwards compatibility.
 *
 * @deprecated Import from "convex/client" instead of "convex/browser"
 * @module
 */

// Re-export all interfaces from convex/client for backwards compatibility
export type {
  // Granular interfaces (ISP)
  MutationClient,
  QueryClient,
  ActionClient,
  // Composed interfaces
  SharedConvexClientInterface,
  LocalQueryResultClient,
  ConvexClientInterface,
  // Watch interfaces
  Watch,
  WatchQueryOptions,
  PaginatedWatch,
  WatchPaginatedQueryOptions,
  ConvexReactClientInterface,
} from "../client/index.js";
