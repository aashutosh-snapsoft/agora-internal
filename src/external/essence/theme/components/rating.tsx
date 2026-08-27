import { Components, Theme } from "@mui/material";
import Star from "@/external/essence/icons/Star";
import StarOutlined from "@/external/essence/icons/StarOutlined";

// ==============================================================
declare module "@mui/material/Rating" {}
// ==============================================================

const Rating = (theme: Theme): Components["MuiRating"] => ({
  styleOverrides: {
    root: { color: theme.palette.warning.main },
    iconEmpty: { color: theme.palette.grey[300] },
  },
  defaultProps: {
    icon: <Star fontSize="inherit" />,
    emptyIcon: <StarOutlined fontSize="inherit" />,
  },
});

export default Rating;
