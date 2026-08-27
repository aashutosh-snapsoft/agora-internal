import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Document } from "@/types/documents";

/**
 * Represents the state of documents in the store.
 *
 * @interface DocumentState
 * @property {Document[]} documents - An array of documents.
 * @property {boolean} loading - Indicates if the documents are currently being loaded.
 * @property {string | null} error - Contains an error message if there was an error loading the documents, otherwise null.
 */
interface DocumentState {
	documents: Document[];
	loading: boolean;
	error: string | null;
}

const initialState: DocumentState = {
	documents: [],
	loading: false,
	error: null,
};

const documentSlice = createSlice({
	name: "documents",
	initialState,
	reducers: {
		setDocuments: (state, action: PayloadAction<Document[]>) => {
			state.documents = action.payload;
		},
	},

});

export default documentSlice.reducer;
export const { setDocuments } = documentSlice.actions;

/**
 * A slice for managing the state of documents linked to a project.
 *
 * This slice handles the fetching of documents associated with a specific project,
 * and manages the loading state and any errors that may occur during the fetch process.
 *
 * @module documentSlice
 *
 * @requires createSlice
 * @requires PayloadAction
 * @requires fetchDocumentsByProject
 * @requires Document
 *
 * @typedef {Object} DocumentState
 * @property {Document[]} documents - An array of documents linked to the project.
 * @property {boolean} loading - Indicates if the documents are currently being loaded.
 * @property {string | null} error - Contains an error message if there was an error loading the documents, otherwise null.
 *
 * @constant {DocumentState} initialState - The initial state of the document slice.
 *
 * @function createSlice
 * @param {string} name - The name of the slice.
 * @param {DocumentState} initialState - The initial state of the slice.
 * @param {Object} reducers - An object containing the slice's reducer functions.
 * @param {Function} extraReducers - A function that defines additional reducers for handling actions.
 *
 * @function extraReducers
 * @param {Object} builder - A builder object for defining additional reducers.
 *
 * @function builder.addCase
 * @param {Function} fetchDocumentsByProject.pending - Handles the pending state of the fetchDocumentsByProject action.
 * @param {Function} fetchDocumentsByProject.fulfilled - Handles the fulfilled state of the fetchDocumentsByProject action.
 * @param {Function} fetchDocumentsByProject.rejected - Handles the rejected state of the fetchDocumentsByProject action.
 *
 * @returns {Object} The document slice reducer.
 */
