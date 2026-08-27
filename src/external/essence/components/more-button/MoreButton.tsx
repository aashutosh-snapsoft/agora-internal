import { FC, useState, ReactNode } from "react";
import {
  Box,
  Fade,
  IconButton,
  IconButtonProps,
  Menu,
  MenuItem,
  styled,
} from "@mui/material";
import MoreVert from "@mui/icons-material/MoreVert";
// CUSTOM UTILS METHOD
import { isDark } from "@/external/essence/utils/constants";

// STYLED COMPONENT
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  flexShrink: 0,
  color: theme.palette.grey[isDark(theme) ? 300 : 400],
}));

const optionList = ["Create", "Edit", "Delete"];

// ==============================================================
interface MoreButtonProps extends IconButtonProps {
  options?: string[];
  renderOptions?: (func: () => void) => ReactNode;
}
// ==============================================================

const MoreButton: FC<MoreButtonProps> = ({
  size = "large",
  options = optionList,
  renderOptions,
  ...props
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = () => setAnchorEl(null);

  return (
    <Box>
      <StyledIconButton
        size={size}
        aria-label="more"
        aria-haspopup="true"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        {...props}
      >
        <MoreVert fontSize="small" />
      </StyledIconButton>

      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        TransitionComponent={Fade}
      >
        {renderOptions
          ? renderOptions(handleClose)
          : options.map((option) => (
              <MenuItem key={option} onClick={handleClose}>
                {option}
              </MenuItem>
            ))}
      </Menu>
    </Box>
  );
};

export default MoreButton;
