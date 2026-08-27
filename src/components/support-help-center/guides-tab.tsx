"use client";

import { FC } from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { GuidesTabProps } from "./support-help-center.types";

const NOTION_GUIDES_URL =
  "https://socratics.notion.site/Guides-2d13c45d6b8480888a0ee2ece04516b9?source=copy_link";

const GuidesTab: FC<GuidesTabProps> = () => {
  const theme = useTheme();

  const handleOpenGuides = () => {
    window.open(NOTION_GUIDES_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2 }}>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 1.5,
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        Access step-by-step product guides in Notion knowledge base
      </Typography>

      <Button
        variant="contained"
        onClick={handleOpenGuides}
        startIcon={
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: "16px",
              fontFamily: "serif",
              lineHeight: 1,
            }}
          >
            N
          </Box>
        }
        sx={{
          backgroundColor: theme.palette.grey[900],
          color: "white",
          textTransform: "none",
          fontWeight: 500,
          fontSize: "14px",
          borderRadius: "8px",
          px: 2,
          py: 1,
          "&:hover": {
            backgroundColor: theme.palette.grey[800],
          },
        }}
      >
        View product guides
      </Button>
    </Box>
  );
};

export default GuidesTab;
