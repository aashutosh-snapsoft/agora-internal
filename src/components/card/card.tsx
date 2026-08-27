"use client";

import { Card as MuiCard, styled } from "@mui/material";

/**
 * ⚠️ DS TOKEN GAP — see components/text-field for the full note.
 * Socratics DS Card (Style=Bordered): white surface, 1px #d4d4d4 border, 8px
 * radius, shadow/sm. These interactive tokens aren't in the app theme yet.
 *
 * A drop-in replacement for MUI <Card> that carries the DS container styling.
 * Compose header / content / footer inside it as normal.
 */
export const Card = styled(MuiCard)({
	backgroundColor: "#ffffff",
	backgroundImage: "none",
	border: "1px solid #d4d4d4",
	borderRadius: 8,
	boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
	overflow: "hidden",
});

export default Card;
