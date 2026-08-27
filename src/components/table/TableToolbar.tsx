import Delete from "@mui/icons-material/Delete";
import { IconButton, Toolbar, Tooltip } from "@mui/material";
// CUSTOM COMPONENT
import { Paragraph } from "@/external/essence/components/typography";

// ==============================================================
interface TableToolbarProps {
  selected: number;
  handleDeleteRows: () => void;
}
// ==============================================================

const TableToolbar = (props: TableToolbarProps) => {
  return (
    <Toolbar sx={{ backgroundColor: "action.selected" }}>
      <Paragraph fontWeight={600} flex="1 1 100%" color="inherit">
        {props.selected} selected
      </Paragraph>

      <Tooltip title="Delete">
        <IconButton onClick={props.handleDeleteRows}>
          <Delete />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
};

export default TableToolbar;
