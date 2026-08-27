import { RootState } from "../store";
import { createSelector } from "@reduxjs/toolkit";

const getProjectState = (state: RootState) => state.project;

// Direct selector to avoid identity-function warnings from createSelector.
export const projectSelector = getProjectState;

// More specific selectors to prevent unnecessary re-renders
export const selectProjects = createSelector(
	[getProjectState],
	(projectState) => projectState.projects
);

export const selectCurrentProject = createSelector(
	[getProjectState],
	(projectState) => projectState.project
);

export const selectIsOnboarding = createSelector(
	[getProjectState],
	(projectState) => projectState.isOnboarding
);

export const selectPageSize = createSelector(
	[getProjectState],
	(projectState) => projectState.pageSize
);
