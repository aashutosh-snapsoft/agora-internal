import { FC } from "react";
import { Box, BoxProps } from "@mui/material";

const FlexRowAlign: FC<BoxProps> = ({ children, ...props }) => (
  <Box display="flex" alignItems="center" justifyContent="center" {...props}>
    {children}
  </Box>
);

export default FlexRowAlign;
