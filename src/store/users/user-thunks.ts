import { User } from "@/types/user";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { clearToken } from "../auth/auth";
import { GraphqlRequestParams } from "../utils/cache-query";

const fetchMeUser = async (forceRefresh?: boolean): Promise<User> => {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: forceRefresh ? "no-store" : "default",
  });

  if (!response.ok) {
    throw new Error("Unauthenticated");
  }

  const data = (await response.json()) as { user: User | null };
  if (!data?.user) {
    throw new Error("Unauthenticated");
  }

  return data.user;
};

export const fetchAuthenticatedUser = createAsyncThunk<
  User,
  GraphqlRequestParams | undefined
>("users/fetchAuthenticatedUser", async (params) => {
  return fetchMeUser(params?.forceRefresh);
});

export const logoutUser = createAsyncThunk<
  void,
  { logout: () => Promise<void> },
  { state: RootState }
>("users/logoutUser", async ({ logout }, { dispatch }) => {
  dispatch(clearToken());
  dispatch({ type: "RESET_STATE" });
  await logout();
});

// Two callers share this thunk (tracked transitional state — SENG-870):
//   • BasicInformation  → first_name / last_name / title
//   • AvatarProvider / useAvatarManager → image_url
// The route allowlist (ALLOWED_FIELDS in /api/auth/profile) mirrors the fields sent here.
export const updateUserProfile = createAsyncThunk<
  string,
  { userId: string; userData: Partial<User> }
>("users/updateProfile", async ({ userData }) => {
  const response = await fetch("/api/auth/profile", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: userData.first_name,
      last_name: userData.last_name,
      title: userData.title,
      image_url: userData.image_url,
    }),
  });

  if (!response.ok) {
    let message = "Failed to update user profile.";
    try {
      const detail = (await response.json()) as { error?: string };
      if (detail?.error) message = detail.error;
    } catch {
      // response has no parseable JSON body — fall back to default message
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
});
