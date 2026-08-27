import { styled, TableCell } from "@mui/material";

// Table spacing constants - single source of truth
const TABLE_CONFIG = {
  columnGap: 24,
  firstColumnPadding: 20,
  rowPaddingY: 8,
  headerPaddingTop: 12,
  headerPaddingBottom: 16,
} as const;

export const HeadTableCell = styled(TableCell)({
  paddingTop: TABLE_CONFIG.headerPaddingTop,
  paddingBottom: TABLE_CONFIG.headerPaddingBottom,
  paddingLeft: 0,
  paddingRight: TABLE_CONFIG.columnGap,
  '&:first-child': {
    paddingLeft: TABLE_CONFIG.firstColumnPadding,
  },
  '&:last-child': {
    paddingRight: 0,
  },
});

export const BodyTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 400,
  paddingTop: TABLE_CONFIG.rowPaddingY,
  paddingBottom: TABLE_CONFIG.rowPaddingY,
  paddingLeft: 0,
  paddingRight: TABLE_CONFIG.columnGap,
  color: theme.palette.text.primary,
  borderTop: `1px dashed ${theme.palette.divider}`,
  '&:first-child': {
    paddingLeft: TABLE_CONFIG.firstColumnPadding,
  },
  '&:last-child': {
    paddingRight: 0,
  },
}));
