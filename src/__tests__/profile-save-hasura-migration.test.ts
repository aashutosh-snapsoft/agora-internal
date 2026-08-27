/**
 * Profile Save — BFF migration (SENG-776 / Hasura decommission)
 *
 * Call chain after migration:
 *   BasicInformation.tsx → dispatch(updateUserProfile)   [name/title path]
 *   AvatarProvider / useAvatarManager → dispatch(updateUserProfile)  [avatar path]
 *     → user-thunks.ts → PATCH /api/auth/profile
 *     → src/app/api/auth/profile/route.ts → Postgres UPDATE
 */

import { updateUserProfile } from "@/store/users/user-thunks";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/store/users/users";

function makeStore() {
  return configureStore({ reducer: { user: userReducer } });
}

describe("updateUserProfile — BFF migration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("calls PATCH /api/auth/profile, not /api/hasura", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user-123" }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const store = makeStore();
    await store.dispatch(
      updateUserProfile({
        userId: "user-123",
        userData: { first_name: "Jane", last_name: "Doe", title: "Engineer" },
      })
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/auth/profile");
    expect(options.method).toBe("PATCH");
    expect(url).not.toContain("/api/hasura");
  });

  it("sends first_name, last_name, title in the request body (name/title path)", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user-123" }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const store = makeStore();
    await store.dispatch(
      updateUserProfile({
        userId: "user-123",
        userData: { first_name: "Jane", last_name: "Doe", title: "Engineer" },
      })
    );

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.first_name).toBe("Jane");
    expect(body.last_name).toBe("Doe");
    expect(body.title).toBe("Engineer");
  });

  it("sends image_url in the request body (avatar path)", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user-123" }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const store = makeStore();
    await store.dispatch(
      updateUserProfile({
        userId: "user-123",
        userData: { image_url: "https://cdn.example.com/avatar/user-123.jpg" },
      })
    );

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/auth/profile");
    const body = JSON.parse(options.body as string);
    expect(body.image_url).toBe("https://cdn.example.com/avatar/user-123.jpg");
  });

  it("returns the user id on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user-abc" }),
    }) as unknown as typeof fetch;

    const store = makeStore();
    const result = await store.dispatch(
      updateUserProfile({ userId: "user-abc", userData: { first_name: "Jane" } })
    );

    expect((result as { payload: string }).payload).toBe("user-abc");
  });

  it("surfaces the route error message from the response body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "No fields to update" }),
    }) as unknown as typeof fetch;

    const store = makeStore();
    const result = await store.dispatch(
      updateUserProfile({ userId: "user-123", userData: {} })
    );

    expect(result.type).toBe("users/updateProfile/rejected");
    expect((result as { error: { message: string } }).error.message).toBe("No fields to update");
  });

  it("throws when the BFF returns a non-ok response without a body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error("not json"); },
    }) as unknown as typeof fetch;

    const store = makeStore();
    const result = await store.dispatch(
      updateUserProfile({ userId: "user-123", userData: { first_name: "Jane" } })
    );

    expect(result.type).toBe("users/updateProfile/rejected");
    expect((result as { error: { message: string } }).error.message).toBe(
      "Failed to update user profile."
    );
  });
});
