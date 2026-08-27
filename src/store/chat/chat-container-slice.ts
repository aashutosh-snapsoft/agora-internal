import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
	/**
	 * Determines whether or not the sidebar chat is expanded or not.
	 */
	isExpanded: boolean;
}

const initialState: ChatState = {
	isExpanded: false,
};

// Create the slice
const chatSlice = createSlice({
	name: "chat",
	initialState,
	reducers: {
		setExpanded(state, action: PayloadAction<boolean>) {
			state.isExpanded = action.payload;
		},
	},
});

export const { setExpanded } = chatSlice.actions;

export default chatSlice.reducer;

/**
 * @file chat-container-slice.ts
 * @description This file contains the Redux slice for managing the chat container state in the project overview UI layout.
 * @functionality The slice handles the expansion and collapse of the chat container.
 */
