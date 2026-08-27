import { ReactNode, ComponentType } from "react";
import { SvgIconProps } from "@mui/material";
import {
	IconProps as PhosphorIconProps,
	FolderOpen,
	Plugs,
	Bell,
	UserCircle,
	UsersThree,
	Question,
	Gear,
} from "@phosphor-icons/react";

interface NavItem {
  type: string;
  name: string;
  path: string;
  label: string;
  access: string;
  iconText: string;
  disabled: boolean;
  badge?: ReactNode;
  children: Partial<NavItem>[];
  icon: (_: SvgIconProps<"svg", unknown>) => JSX.Element;
}

const createPhosphorIcon = (
  PhosphorIcon: ComponentType<PhosphorIconProps>,
  name: string
) => {
  const IconComponent = (props: SvgIconProps) => (
    <PhosphorIcon weight="duotone" size={24} {...props} />
  );

  IconComponent.displayName = `PhosphorIcon${name}`;

  const QuestionOutlineIcon = (props: SvgIconProps) => (
	  <PhosphorIcon weight="duotone" size={24} {...props} />
  );

  QuestionOutlineIcon.displayName = `PhosphorIcon${name}`;

  return IconComponent;
};

// Dedicated outline variant for Support so the question mark is not filled.
const QuestionOutlineIcon = (props: SvgIconProps) => (
	<Question weight="regular" size={24} color="gray" {...props} />
);
QuestionOutlineIcon.displayName = "PhosphorIconQuestionOutline";

export type Navigations = Partial<NavItem>;

export const navigations: Navigations[] = [
  // { type: "label", label: "Dashboard" },

  {
    name: "Projects",
    path: "/projects",
    icon: createPhosphorIcon(FolderOpen, "FolderOpen"),
    disabled: false,
  },
  // {
  //   name: "Integrations",
  //   path: "/integrations",
  //   icon: createPhosphorIcon(Plugs, "Plugs"),
  //   disabled: true,
  // },
  // {
  //   name: "Notifications",
  //   path: "/notifications",
  //   icon: createPhosphorIcon(Bell, "Bell"),
  //   disabled: true,
  // },
  // {
  //   name: "Profile",
  //   path: "/profile",
  //   icon: createPhosphorIcon(UserCircle, "UserCircle"),
  //   disabled: false,
  // },
  // {
  //   name: "Team",
  //   path: "/team",
  //   icon: createPhosphorIcon(UsersThree, "UsersThree"),
  //   disabled: true,
  // },
  // No "Compose" nav item — Compose handoffs live on the projects page
  // (ComposeProjectsList), which carries project context. See SENG-792.
  {
    name: "Support",
    path: "/support",
    icon: createPhosphorIcon(Question, "QuestionOutline"),
    disabled: false,
  },
  // {
  //   name: "Settings",
  //   path: "/debug/settings",
  //   icon: createPhosphorIcon(Gear, "Gear"),
  //   disabled: true,
  // },
];
