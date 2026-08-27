import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { setExpanded } from "./chat-container-slice";

/**
 * toggleChat is the only thunk with a live dispatcher: the global sidebar's
 * chat-toggle button (src/external/essence/layouts/dashboard/Sidebar/
 * DashboardSidebar.tsx) dispatches it.
 *
 * This file used to also export openChat/closeChat (symmetric with
 * toggleChat, but never actually dispatched anywhere — confirmed directly,
 * not inferred from naming) and sendMessage/appendMessageToken/
 * loadChatHistory/clearChatHistory/manageForecastButtonMessages (SCS-144) —
 * the latter group also confirmed to have ZERO dispatchers anywhere in the
 * app before removal. They existed to drive the financialChat panel (removed
 * in SCS-143) and the forecast-button bookkeeping for the
 * financial-model-table/forecast-driver-modal subsystem (removed in this same
 * ticket, SCS-144) — both dead features. Removing them let the
 * chatMessages Redux slice close out entirely too (it was chat-messages-
 * slice.ts, chat-message-types.ts, message-helpers.ts — all deleted here;
 * see this ticket's PR/comment history if you need the reachability trace
 * that established that).
 */
export const toggleChat = createAsyncThunk<void, void, { state: RootState }>(
	"chat/toggleChat",
	async (_, { getState, dispatch }) => {
		const currentState = getState().chat.isExpanded;
		dispatch(setExpanded(!currentState));
	}
);
