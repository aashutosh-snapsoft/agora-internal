import { updateUserProfile } from "../user-thunks";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../users";

function makeStore() {
  return configureStore({ reducer: { user: userReducer } });
}

describe("User Thunks", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("updateUserProfile", () => {
    it("should update user profile", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "user-1" }),
      }) as unknown as typeof fetch;

      const store = makeStore();
      const result = await store.dispatch(
        updateUserProfile({
          userId: "user-1",
          userData: { first_name: "John", last_name: "Doe" },
        })
      );

      expect((result as { payload: string }).payload).toBe("user-1");
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/profile",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should throw error if update fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }) as unknown as typeof fetch;

      const store = makeStore();
      const result = await store.dispatch(
        updateUserProfile({ userId: "user-1", userData: {} })
      );

      expect(result.type).toBe("users/updateProfile/rejected");
      expect((result as any).error.message).toContain("Failed to update user profile");
    });

    it("should throw error if unauthorized", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }) as unknown as typeof fetch;

      const store = makeStore();
      const result = await store.dispatch(
        updateUserProfile({ userId: "user-1", userData: {} })
      );

      expect(result.type).toBe("users/updateProfile/rejected");
    });
  });
});
