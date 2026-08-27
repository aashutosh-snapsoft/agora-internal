import { Components } from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  CalendarMonthOutlined,
} from "@mui/icons-material";

// ==============================================================
// DATE PICKER
// ==============================================================
export const DatePicker = (): Components["MuiDatePicker"] => ({
  defaultProps: {
    slots: {
      openPickerIcon: CalendarMonthOutlined,
      switchViewIcon: (props) => (
        <KeyboardArrowDown {...props} fontSize="small" />
      ),
      leftArrowIcon: (props) => (
        <KeyboardArrowLeft {...props} fontSize="small" />
      ),
      rightArrowIcon: (props) => (
        <KeyboardArrowRight {...props} fontSize="small" />
      ),
    },
  },
});

export const DesktopDatePicker = (): Components["MuiDesktopDatePicker"] => ({
  defaultProps: {
    slotProps: {
      desktopPaper: { sx: { borderRadius: 2, boxShadow: 4 } }
    },
    slots: DatePicker()?.defaultProps?.slots,
  },
});

export const MobileDatePicker = (): Components["MuiMobileDatePicker"] => ({
  defaultProps: DatePicker()?.defaultProps,
});

export const StaticDatePicker = (): Components["MuiStaticDatePicker"] => ({
  defaultProps: DatePicker()?.defaultProps,
});

// ==============================================================
// TIME PICKER
// ==============================================================
export const TimePicker = (): Components["MuiTimePicker"] => ({
  defaultProps: {
    slotProps: {
      desktopPaper: {
        sx: {
          padding: 2,
          boxShadow: 4,
          borderRadius: 2,
          ".MuiPickersArrowSwitcher-spacer": { width: 10 },
          ".MuiClock-pmButton .MuiTypography-caption": { fontWeight: 600 },
          ".MuiClock-amButton .MuiTypography-caption": { fontWeight: 600 },
        },
      }
    },
    slots: {
      leftArrowIcon: (props) => (
        <KeyboardArrowLeft {...props} fontSize="small" />
      ),
      rightArrowIcon: (props) => (
        <KeyboardArrowRight {...props} fontSize="small" />
      ),
    },
  },
});

export const DesktopTimePicker = (): Components["MuiDesktopTimePicker"] => ({
  defaultProps: TimePicker()?.defaultProps,
});

// ==============================================================
// DATE TIME PICKER
// ==============================================================
export const DateTimePicker = (): Components["MuiDateTimePicker"] => ({
  defaultProps: {
    slotProps: {
      desktopPaper: { sx: { borderRadius: 2, boxShadow: 4 } }
    },
    slots: {
      openPickerIcon: CalendarMonthOutlined,
      switchViewIcon: (props) => <KeyboardArrowDown {...props} fontSize="small" />,
      leftArrowIcon: (props) => <KeyboardArrowLeft {...props} fontSize="small" />,
      rightArrowIcon: (props) => <KeyboardArrowRight {...props} fontSize="small" />,
    },
  },
});

export const DesktopDateTimePicker = (): Components["MuiDesktopDateTimePicker"] => ({
  defaultProps: {
    slotProps: {
      desktopPaper: { sx: { borderRadius: 2, boxShadow: 4 } }
    },
    slots: {
      openPickerIcon: CalendarMonthOutlined,
      switchViewIcon: (props) => <KeyboardArrowDown {...props} fontSize="small" />,
      leftArrowIcon: (props) => <KeyboardArrowLeft {...props} fontSize="small" />,
      rightArrowIcon: (props) => <KeyboardArrowRight {...props} fontSize="small" />,
    },
  },
});
