import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Project, ProjectWithFMComponents } from "@/types/project";

/**
 * Represents the state of the projects in the store.
 */
interface ProjectState {
	/**
	 * This is the list of projects that the user has access to.
	 * This list is updated whenever the user visits the projects list page.
	 */
	projects: Project[];

	/**
	 * Whenever the user selects a project from the projects list,
	 * or visits a projects/<pid> page, this state is updated to
	 * select the project as found in the `projects` state.
	 *
	 * Note that after the page has loaded, the project will be
	 * re-fetched to ensure that the project state is the most updated.
	 *
	 * Note that this object is used only for the following purposes:
	 * - A
	 * - B
	 * - C
	 */
	project: ProjectWithFMComponents | null;

	/**
	 * Indicates whether the onboarding process is active or not.
	 */
	isOnboarding: boolean | null;

	/**
	 * Indicates whether the project data is currently being loaded.
	 */
	loading: boolean;

	/**
	 * An error message if there was an error loading the project data, otherwise null.
	 */
	error: string | null;

	/**
	 * The preferred number of projects to display per page in the projects list.
	 */
	pageSize: number;
}

const initialState: ProjectState = {
	projects: [],
	project: null,
	isOnboarding: null,
	loading: false,
	error: null,
	pageSize: 10,
};

const projectSlice = createSlice({
	name: "projects",
	initialState,
	reducers: {
		resetProjectData(state) {
			state.project = null;
		},
		setPageSize(state, action: PayloadAction<number>) {
			state.pageSize = action.payload;
		},
	},
});

export default projectSlice.reducer;
export const { resetProjectData, setPageSize } = projectSlice.actions;

/**
 * A slice for managing project-related state in the Redux store.
 *
 * @remarks
 * This slice handles the following actions:
 * - Fetching all projects
 * - Fetching a single project
 * - Creating a new project
 * - Updating an existing project
 *
 * The state managed by this slice includes:
 * - `projects`: An array of project objects
 * - `project`: A single project object
 * - `loading`: A boolean indicating if a request is in progress
 * - `error`: An error message if a request fails
 * - `isOnboarding`: A boolean indicating if the project is in the onboarding phase
 *
 * @example
 * Example usage:
 * ```typescript
 * import { configureStore } from '@reduxjs/toolkit';
 * import projectReducer from './projects';
 *
 * const store = configureStore({
 *   reducer: {
 *     projects: projectReducer,
 *   },
 * });
 * ```
 */
