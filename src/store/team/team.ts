import { createSlice } from "@reduxjs/toolkit";
import { TeamMember } from "@/types/teams";

interface TeamState {
	members: TeamMember[];
	loading: boolean;
	error: string | null;
}

const initialState: TeamState = {
	members: [],
	loading: false,
	error: null,
};

const teamSlice = createSlice({
	name: "team",
	initialState,
	reducers: {},
});

export default teamSlice.reducer;
