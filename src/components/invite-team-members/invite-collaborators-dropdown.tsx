import React, { useState } from "react";
import { Box } from "@mui/system";
import Select, {
	MultiValue,
	MultiValueGenericProps,
	MultiValueRemoveProps,
	components,
} from "react-select";
import {
	multiValueContainerStyles,
	optionsContainerStyles,
	StyledAvatar,
	StyledRemoveButton,
	StyledTypography,
} from "./invite-team-members-styles";
import { X } from "@phosphor-icons/react";
import { TeamMemberListElement } from "./invite-team-members-types";
import { TeamMember } from "@/types/teams";

const InviteCollaborators = ({
	teamMembers,
	selectedMembers,
	setSelectedMembers,
}: {
	teamMembers: TeamMember[];
	selectedMembers: TeamMember[];
	setSelectedMembers: (members: TeamMember[]) => void;
}) => {
	const handleChange = (newValue: MultiValue<TeamMemberListElement> | null) => {
		if (newValue) {
			setSelectedMembers(
				newValue.map((member) => {
					return {
						id: member.value,
						name: member.label,
						avatar: member.avatar,
					};
				})
			);
		} else {
			setSelectedMembers([]);
		}
	};

	const CustomNoOption = (props: any) => (
		<components.NoOptionsMessage {...props}>
			<span>No members found. Please refine your search.</span>
		</components.NoOptionsMessage>
	);

	const CustomMenuList = (props: any) => (
		<components.MenuList {...props}>{props.children}</components.MenuList>
	);

	/**
	 * Custom component to render the remove icon for selected team members in a dropdown.
	 *
	 * @param {MultiValueRemoveProps<TeamMemberListElement>} props - The properties passed to the MultiValueRemove component.
	 * @returns {JSX.Element} The rendered MultiValueRemove component with a custom remove icon.
	 */
	const MultiValueRemove = (
		props: MultiValueRemoveProps<TeamMemberListElement>
	) => {
		return (
			<components.MultiValueRemove {...props}>
				<X />
			</components.MultiValueRemove>
		);
	};

	/**
	 * CustomOption component renders a custom option for a dropdown menu.
	 * It displays an avatar, a label, and an "Add" button.
	 *
	 * @param {any} props - The properties passed to the component.
	 * @param {object} props.data - The data object containing information for the option.
	 * @param {string} props.data.label - The label to be displayed for the option.
	 * @param {string} props.data.avatar - The URL of the avatar image to be displayed.
	 *
	 * @returns {JSX.Element} The rendered custom option component.
	 */
	const CustomOption = (props: any) => (
		<components.Option {...props}>
			<Box display="flex" justifyContent="space-between" alignItems="center">
				<Box display="flex" alignItems={"center"} gap={1}>
					<StyledAvatar alt={props.data.label} src={props.data.avatar} />
					<StyledTypography>{props.data.label}</StyledTypography>
				</Box>
				<StyledRemoveButton variant="text" onClick={() => null}>
					Add
				</StyledRemoveButton>
			</Box>
		</components.Option>
	);

	/**
	 * MultiValueLabel component for rendering custom labels in a multi-select dropdown.
	 *
	 * @param {MultiValueGenericProps<TeamMemberListElement>} props - The properties passed to the component.
	 * @returns {JSX.Element} The rendered MultiValueLabel component.
	 *
	 * The component uses the `components.MultiValueLabel` from react-select to render
	 * a custom label that includes an avatar and a label text.
	 */
	const MultiValueLabel = (
		props: MultiValueGenericProps<TeamMemberListElement>
	) => {
		return (
			<components.MultiValueLabel {...props}>
				<Box display="flex" alignItems={"center"} gap={1}>
					<Box display="flex" alignItems={"center"} gap={1}>
						<StyledAvatar alt={props.data.label} src={props.data.avatar} />
						<StyledTypography>{props.data.label}</StyledTypography>
					</Box>
				</Box>
			</components.MultiValueLabel>
		);
	};

	return (
		<Select
			options={teamMembers.map((member) => ({
				value: member.id,
				label: member.name,
				avatar: member.avatar ?? "",
			}))}
			components={{
				MultiValueLabel,
				MultiValueRemove,
				Option: CustomOption,
				NoOptionsMessage: CustomNoOption,
				MenuList: CustomMenuList,
				DropdownIndicator: null,
			}}
			onChange={handleChange}
			value={selectedMembers.map((member) => ({
				value: member.id,
				label: member.name,
				avatar: member.avatar ?? "",
			}))}
			isMulti
			placeholder="Select team members..."
			isClearable={false}
			hideSelectedOptions
			styles={{
				control: (base) => {
					return {
						...base,
						...optionsContainerStyles,
						flexDirection: optionsContainerStyles.flexDirection as
							| "row"
							| "column",
					};
				},
				valueContainer: (base) => {
					return {
						...base,
						display: "flex",
						flexWrap: "wrap",
						gap: "8px",
					};
				},
				multiValue: (base) => {
					return {
						...base,
						...multiValueContainerStyles,
						flexWrap: multiValueContainerStyles.flexWrap as
							| "nowrap"
							| "wrap"
							| "wrap-reverse"
							| undefined,
					};
				},
				multiValueLabel: (base) => {
					return {
						...base,
						background: "transparent",
					};
				},
			}}
		/>
	);
};

export default InviteCollaborators;
