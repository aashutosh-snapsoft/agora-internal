import { ExpandMore } from "@mui/icons-material";
import { Components, Theme } from "@mui/material";

const Autocomplete = (theme: Theme): Components["MuiAutocomplete"] => {
  return {
    defaultProps: {
      popupIcon: <ExpandMore />,
      slotProps: {
        paper: {
          sx: {
            marginTop: 1,
            borderRadius: 2,
          },
        },
      },
    },
    styleOverrides: {
      option: {
        padding: 10,
        fontSize: 14,
        borderRadius: 8,
        marginInline: 10,
      },
      tag: { maxWidth: 130 },
    },
  };
};

export default Autocomplete;
