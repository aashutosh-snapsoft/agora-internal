import { FC } from "react";
import { Box, BoxProps } from "@mui/material";

interface FlexBetweenProps extends BoxProps {
  component: any;
}

const FlexBetween: FC<FlexBetweenProps> = ({ children, component, ...props }: FlexBetweenProps) => (
  <Box
    display="flex"
    component={component}
    alignItems="center"
    justifyContent="space-between"
    {...props}
  >
    {children}
  </Box>
);

export default FlexBetween;
