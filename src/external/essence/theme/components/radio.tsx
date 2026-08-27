import { Components } from "@mui/material";
import RadioButtonIcon from "@/external/essence/icons/RadioButtonIcon";
import RadioButtonChecked from "@/external/essence/icons/RadioButtonChecked";

// ==============================================================
declare module "@mui/material/Radio" {
  interface RadioPropsSizeOverrides {
    large: true;
  }
}
// ==============================================================

const Radio = (): Components["MuiRadio"] => ({
  defaultProps: {
    icon: <RadioButtonIcon />,
    checkedIcon: <RadioButtonChecked />,
  },
  styleOverrides: {
    root: { padding: 6 },
  },
  variants: [
    {
      props: { size: "large" },
      style: { ".MuiSvgIcon-root": { fontSize: "1.75rem" } },
    },
  ],
});

export default Radio;
