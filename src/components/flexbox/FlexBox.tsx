import { FC } from "react";
import { Box, BoxProps } from "@mui/material";

interface FlexBoxProps extends BoxProps {
  component: any;
}

const FlexBox: FC<FlexBoxProps> = ({ children, component, ...props }: FlexBoxProps) => (
  <Box display="flex" component={component} {...props}>
    {children}
  </Box>
);

export default FlexBox;
