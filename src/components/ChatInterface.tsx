"use client";

import { Typography } from "@mui/material";
import React, { useState, useCallback } from "react";
import Link from "next/link";
// const UndoRedoButtons = () => (
//   <div className="flex space-x-2">
//     <button className="p-1 rounded hover:bg-gray-100">
//       <UndoIcon />
//     </button>
//     <button className="p-1 rounded hover:bg-gray-100">
//       <RedoIcon />
//     </button>
//   </div>
// );

const UndoIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M3 7v6h6"></path>
		<path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
	</svg>
);

const RedoIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M21 7v6h-6"></path>
		<path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
	</svg>
);

const ChatInterface = () => {
	const [message, setMessage] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);

	const handleExpand = useCallback(() => setIsExpanded(true), []);
	const handleCollapse = useCallback(() => setIsExpanded(false), []);

	return (
		<div
			className={`fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg transition-all duration-300 ${
				isExpanded ? "h-96" : "h-14"
			}`}
		>
			{isExpanded ? (
				<div className="h-full flex flex-col">
					<div className="flex-1 overflow-y-auto p-4">
						<ChatMessage
							avatar="/path-to-avatar.png"
							message="Let's get started."
							isBot={true}
						/>
						<ChatMessage
							avatar="/path-to-avatar.png"
							message="What type of project is this?"
							isBot={true}
						/>
						<div className="flex flex-wrap gap-2 mt-2">
							<Button>Client Services</Button>
							<Button>Pitch</Button>
							<Button>Live Deal</Button>
						</div>
					</div>
					<div className="border-t p-4">
						<div className="relative">
							<input
								type="text"
								placeholder="Chat with Socrates ..."
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								className="w-full py-2 pl-4 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button className="absolute right-2 top-1/2 transform -translate-y-1/2">
								<SendIcon />
							</button>
						</div>
						<Typography variant="Text6Medium" color="text.secondary">
							Generated content may contain errors.{" "}
							<Link
								target="_blank"
								rel="noopener noreferrer"
								href="https://socratics.notion.site/Important-Disclaimer-on-AI-Generated-Content-1c13c45d6b84802d9196dc30421ad288?pvs=4"
								className="underline"
							>
								Learn More.
							</Link>
						</Typography>
					</div>
				</div>
			) : (
				<button
					onClick={handleExpand}
					className="w-full h-14 flex items-center px-4 text-left"
				>
					<div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mr-3">
						<span className="text-white text-xl">$</span>
					</div>
					<span>Chat with Socrates</span>
				</button>
			)}
			{isExpanded && (
				<button
					onClick={handleCollapse}
					className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
				>
					<CloseIcon />
				</button>
			)}
		</div>
	);
};

const ChatMessage = ({
	message,
	isBot,
}: {
	avatar: string;
	message: string;
	isBot: boolean;
}) => (
	<div className={`flex items-start mb-4 ${isBot ? "" : "justify-end"}`}>
		{isBot && (
			<img
				src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
				alt="User avatar"
				width={16}
				height={16}
				className="w-8 h-8 rounded-full mr-2"
			/>
		)}
		<div className={`p-2 rounded-lg ${isBot ? "bg-green-100" : "bg-blue-100"}`}>
			{message}
		</div>
	</div>
);

const Button = ({ children }: { children: React.ReactNode }) => (
	<button className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors">
		{children}
	</button>
);

const SendIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="22" y1="2" x2="11" y2="13"></line>
		<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
	</svg>
);

const CloseIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="18" y1="6" x2="6" y2="18"></line>
		<line x1="6" y1="6" x2="18" y2="18"></line>
	</svg>
);

export default ChatInterface;
