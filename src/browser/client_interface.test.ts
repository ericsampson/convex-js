import { describe, test, expect, vi } from "vitest";
import type { ConvexClientInterface } from "./client_interface.js";
import { ConvexClient } from "./simple_client.js";
import { makeFunctionReference } from "../server/index.js";

// Verify ConvexClient implements ConvexClientInterface at compile time
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ConvexClientInterface = {} as ConvexClient;

describe("ConvexClientInterface", () => {
  test("ConvexClient satisfies ConvexClientInterface", () => {
    // This test verifies at runtime that ConvexClient has all the methods
    // defined in ConvexClientInterface
    const interfaceMethods: (keyof ConvexClientInterface)[] = [
      "disabled",
      "closed",
      "client",
      "onUpdate",
      "mutation",
      "action",
      "query",
      "connectionState",
      "subscribeToConnectionState",
      "setAuth",
      "close",
    ];

    // Create a disabled client to avoid needing a real connection
    const client = new ConvexClient("https://test.convex.cloud", {
      disabled: true,
    });

    for (const method of interfaceMethods) {
      expect(method in client).toBe(true);
    }
  });

  test("Mock implementing ConvexClientInterface can be used as ConvexClientInterface", () => {
    // This demonstrates that test fakes can implement the interface
    const mockQuery = makeFunctionReference<"query">("test:query");
    const mockMutation = makeFunctionReference<"mutation">("test:mutation");
    const mockAction = makeFunctionReference<"action">("test:action");

    const mockClient: ConvexClientInterface = {
      disabled: false,
      closed: false,
      client: {
        localQueryResult: vi.fn().mockReturnValue(undefined),
      },
      onUpdate: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
        getCurrentValue: vi.fn(),
        getQueryLogs: vi.fn(),
      }),
      mutation: vi.fn().mockResolvedValue(undefined),
      action: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue(undefined),
      connectionState: vi.fn().mockReturnValue({
        hasInflightRequests: false,
        isWebSocketConnected: true,
      }),
      subscribeToConnectionState: vi.fn().mockReturnValue(() => {}),
      setAuth: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // Verify the mock can be used
    expect(mockClient.disabled).toBe(false);
    expect(mockClient.closed).toBe(false);

    mockClient.onUpdate(mockQuery, {}, () => {});
    expect(mockClient.onUpdate).toHaveBeenCalledWith(mockQuery, {}, expect.any(Function));

    void mockClient.mutation(mockMutation, {});
    expect(mockClient.mutation).toHaveBeenCalledWith(mockMutation, {});

    void mockClient.action(mockAction, {});
    expect(mockClient.action).toHaveBeenCalledWith(mockAction, {});

    void mockClient.query(mockQuery, {});
    expect(mockClient.query).toHaveBeenCalledWith(mockQuery, {});

    mockClient.connectionState();
    expect(mockClient.connectionState).toHaveBeenCalled();

    mockClient.subscribeToConnectionState(() => {});
    expect(mockClient.subscribeToConnectionState).toHaveBeenCalled();

    mockClient.setAuth(async () => null);
    expect(mockClient.setAuth).toHaveBeenCalled();

    void mockClient.close();
    expect(mockClient.close).toHaveBeenCalled();
  });

  test("Function accepting ConvexClientInterface works with ConvexClient", () => {
    // This verifies that code written against the interface works with the real client
    function useClient(client: ConvexClientInterface): boolean {
      return !client.disabled && !client.closed;
    }

    const client = new ConvexClient("https://test.convex.cloud", {
      disabled: true,
    });

    // ConvexClient should be assignable to ConvexClientInterface
    const result = useClient(client);
    expect(result).toBe(false); // disabled is true
  });
});
