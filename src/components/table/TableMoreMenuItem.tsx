import { SvgIconComponent } from "@mui/icons-material";
import { ListItemIcon, MenuItem, ListItemText } from "@mui/material";

// ==============================================================
interface TableMoreMenuItemProps {
  title: string;
  Icon: SvgIconComponent;
  handleClick: () => void;
}
// ==============================================================

const TableMoreMenuItem = (props: TableMoreMenuItemProps) => {
  const { Icon, title, handleClick } = props;

  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        <Icon fontSize="small" color="inherit" />
      </ListItemIcon>

      <ListItemText disableTypography>{title}</ListItemText>
    </MenuItem>
  );
};

export default TableMoreMenuItem;
