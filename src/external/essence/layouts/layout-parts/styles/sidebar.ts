import { Box, Button, ButtonBase, ButtonProps, styled } from "@mui/material";
// CUSTOM COMPONENTS
import { Paragraph, Span } from "@/external/essence/components/typography";
// CUSTOM ICON COMPONENT
import ChevronRight from "@/external/essence/icons/ChevronRight";
// CUSTOM UTILS METHOD
import { isDark } from "@/external/essence/utils/constants";

// ==============================================================
type Active = { active: number };
type Compact = { compact: number };
type ActiveCompact = Active & Compact;
type CollapseCompact = ActiveCompact & { collapsed: number };
// ==============================================================

export const SIDEBAR_WIDTH_EXPANDED = 200;
export const SIDEBAR_WIDTH_COMPACT = 88;

// Slimmer sidebar to free more horizontal space while keeping a compact hover proof width.
export const SidebarWrapper = styled(Box)<Compact>(({ theme, compact }) => ({
  width: SIDEBAR_WIDTH_EXPANDED,
  height: "100vh",
  position: "fixed",
  zIndex: theme.zIndex.drawer,
  // Use same transition timing as LayoutBodyWrapper for synchronized animation
  transition: "width 0.3s ease-in-out, padding 0.3s ease-in-out",
  borderRight: `1px dashed ${theme.palette.grey[200]}`,
  ...(compact && { width: SIDEBAR_WIDTH_COMPACT, "&:hover": { width: SIDEBAR_WIDTH_COMPACT } }),
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
  ...(compact && { padding: "24px 8px 8px 8px" }),
}));

export const WorkspaceSidebarWrapper = styled(Box)(({ theme }) => ({
  width: SIDEBAR_WIDTH_COMPACT,
  height: "calc(100vh - 170px)", // 80px is the height of the top header, 40px is the height of the chat
  position: "fixed",
  zIndex: theme.zIndex.drawer,
  transition: "width 0.3s ease-in-out",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
}));

// COMMON ICON STYLE
export const ICON_STYLE = (active: number) => ({
  fontSize: 18,
  color: active ? "text.primary" : "text.secondary",
});

// SIDEBAR ACCORDION RELATED STYLED COMPONENTS
export const AccordionExpandPanel = styled(Box)({
  "&.expand": { "& .expand": { paddingLeft: 8 } },
});

export const BulletIcon = styled(Box)<Active>(({ theme, active }) => ({
  width: 4,
  height: 4,
  marginLeft: "10px",
  marginRight: "8px",
  overflow: "hidden",
  borderRadius: 8,
  background: theme.palette.text.secondary,
  ...(active && {
    background: theme.palette.primary.main,
    boxShadow: `0px 0px 0px 3px ${isDark(theme) ? theme.palette.grey[700] : theme.palette.primary[100]
      }`,
  }),
}));

export const AccordionButton = styled(ButtonBase)<Active>(({ theme }) => ({
  height: 48,
  width: "100%",
  padding: "0 12px",
  marginBottom: 5,
  borderRadius: 8,
  justifyContent: "space-between",
  "&:hover": {
    borderRadius: 50,
    backgroundColor: theme.palette.action.hover,
    "& span, & .MuiSvgIcon-root": { color: theme.palette.text.primary },
  },
}));

export const ChevronRightStyled = styled(ChevronRight)<CollapseCompact>(
  ({ collapsed, compact, active, theme }) => ({
    fontSize: 18,
    color: theme.palette.grey[400],
    transition: "transform 0.3s cubic-bezier(0, 0, 0.2, 1) 0ms",
    transform: collapsed ? "rotate(90deg)" : "rotate(0deg)",
    ...(compact && { opacity: 0, width: 0 }),
    ...(active && { color: theme.palette.text.primary }),
    ...(theme.direction === "rtl" && {
      rotate: "180deg",
      transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
    }),
  })
);

export const ItemText = styled(Span)<ActiveCompact>(
  ({ theme, compact, active }) => ({
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
    paddingLeft: "0.8rem",
    transition: "all 0.15s ease",
    color: active ? theme.palette.text.primary : theme.palette.text.secondary,
    ...(compact && { opacity: 0, width: 0, paddingLeft: 0 }),
  })
);

// MULTI LEVEL MENU RELATED STYLED COMPONENTS
export const NavItemButton = styled(ButtonBase)<Active>(
  ({ theme, active }) => ({
    height: 44,
    width: "100%",
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
    justifyContent: "flex-start",
    "&.Mui-disabled": { opacity: 0.6 },
    ...(active && {
      borderRadius: 8,
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.action.hover,
    }),

    "&:hover": {
      borderRadius: 8,
      backgroundColor: theme.palette.action.hover,
      "& > span, & > .MuiSvgIcon-root": { color: theme.palette.text.primary },
    },
  })
);

export const ListLabel = styled(Paragraph)<Compact>(({ theme, compact }) => ({
  fontSize: 12,
  marginTop: 20,
  marginLeft: 15,
  fontWeight: 600,
  marginBottom: 10,
  textTransform: "uppercase",
  color: theme.palette.text.primary,
  ...(compact && { opacity: 0, width: 0 }),
}));

interface ChatButtonProps extends ButtonProps {
  isExpanded?: boolean;
}

export const ChatButtonStyled = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isExpanded',
})<ChatButtonProps>(({ theme, isExpanded }) => ({
  height: 40,
  maxWidth: 40,
  minWidth: 40,
  borderRadius: 8,
  padding: 8,
  backgroundColor: theme.palette.grey[900],
  boxShadow: theme.shadows[3],
  display: 'flex',
  alignItems: 'center',
  alignContent: 'center',
  transition: 'background-color 300ms ease-out, transform 300ms ease-out',
  "&:hover": {
    backgroundColor: isExpanded
      ? theme.palette.grey[900]
      : (theme.palette as any).brand[500]
  },
}));