import { CustomCellRendererProps } from "@ag-grid-community/react";
import React, { useEffect, useState, useCallback } from "react";

const CategoryCellRenderer = (
	props: CustomCellRendererProps & { isFilterRenderer?: boolean }
) => {
	const [value, setValue] = useState<string>("");

	useEffect(() => {
		if (!props.value) {
			setValue(props.isFilterRenderer ? "(Blanks)" : props.value);
		} else {
			setValue(props.value);
		}
	}, [props.value, props.isFilterRenderer]);

	// add a clickable (i) icon to the right of the value, to show a justification for the categorization
	// it should open a popover when hovered over
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const justification =
		props.value?.justification || "No justification provided";

	const Popover = () => {
		if (!isPopoverOpen) return null;

		return (
			<div
				className="absolute z-50 p-2 bg-white border border-gray-200 rounded shadow-lg"
				style={{
					top: "100%",
					left: "0",
					minWidth: "200px",
					maxWidth: "300px",
				}}
			>
				<div className="text-sm text-gray-700">{justification}</div>
				<button
					className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
					onClick={(e) => {
						e.stopPropagation();
						setIsPopoverOpen(false);
					}}
				>
					×
				</button>
			</div>
		);
	};

	const InfoIcon = () => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="text-blue-500 hover:text-blue-700 cursor-pointer inline-block"
		>
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="12" y1="16" x2="12" y2="12"></line>
			<line x1="12" y1="8" x2="12.01" y2="8"></line>
		</svg>
	);

	const handleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsPopoverOpen(false);
	}, []);

	return (
		<div
			className="relative"
			onMouseOver={() => setIsPopoverOpen(true)}
			onMouseLeave={() => setIsPopoverOpen(false)}
		>
			{value}{" "}
			<div className="inline-block">
				<InfoIcon />
			</div>
			<Popover />
		</div>
	);
};

export default CategoryCellRenderer;
