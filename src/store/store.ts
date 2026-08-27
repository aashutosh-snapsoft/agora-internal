// src/store/store.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./auth/auth";
import projectReducer from "./projects/projects";
import documentsReducer from "./documents/documents";
import userReducer from "./users/users";
import chatReducer from "./chat/chat-container-slice";
import financialModelingReducer from "./financialModels/financial-models";
import teamReducer from "./team/team";

// Combine all reducers
const appReducers = combineReducers({
	auth: authReducer,
	project: projectReducer,
	user: userReducer,
	financial_modeling: financialModelingReducer,
	documents: documentsReducer,
	chat: chatReducer,
	team: teamReducer,
});

const rootReducer = (state: any, action: any) => {
	if (action.type === "RESET_STATE") {
		// Drop all in-memory state; client persistence is intentionally disabled.
		return appReducers(undefined, action);
	}

	return appReducers(state, action);
};

const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
