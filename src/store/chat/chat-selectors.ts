import { RootState } from "../store";
import { createSelector } from "@reduxjs/toolkit";

const getChatState = (state: RootState) => state.chat;

export const selectChatState = createSelector(
  [getChatState],
  (chatState) => ({ ...chatState })
);
