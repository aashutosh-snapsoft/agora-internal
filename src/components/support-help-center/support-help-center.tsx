"use client";

import { FC, useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  Fade,
  Button,
} from "@mui/material";
import { X, DotsSixVertical, Question } from "@phosphor-icons/react";
import { useDraggable } from "@/hooks/useDraggable";
import {
  SupportHelpCenterProps,
  HelpCenterTab,
} from "./support-help-center.types";
import FAQTab from "./faq-tab";
import GuidesTab from "./guides-tab";
import ContactTab from "./contact-tab";

// Panel dimensions
const PANEL_WIDTH = 400;
const PANEL_HEIGHT_ESTIMATE = 600;
const BUTTON_PANEL_GAP = 8;

const SupportHelpCenter: FC<SupportHelpCenterProps> = ({
  currentStep,
  projectId,
  projectName,
}) => {
  const theme = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HelpCenterTab>("faqs");

  // Calculate panel position anchored above the "Need help" button
  const getPositionAboveButton = useCallback((panelHeight?: number) => {
    const button = buttonRef.current;
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      const height = panelHeight || PANEL_HEIGHT_ESTIMATE;
      return {
        x: buttonRect.left,
        y: Math.max(8, buttonRect.top - height - BUTTON_PANEL_GAP),
      };
    }
    // Fallback
    return {
      x: 24,
      y: typeof window !== "undefined"
        ? window.innerHeight - PANEL_HEIGHT_ESTIMATE - 24
        : 200,
    };
  }, []);

  const initialPosition = useMemo(() => getPositionAboveButton(), [getPositionAboveButton]);

  // Draggable bounds: constrain so the panel always stays above the button
  const [draggableBounds, setDraggableBounds] = useState<
    { left: number; top: number; right: number; bottom: number } | undefined
  >(undefined);

  const { position, isDragging, handleMouseDown, resetToPosition } = useDraggable(
    {
      initialPosition,
      elementRef: panelRef,
      bounds: draggableBounds,
    }
  );

  // Update bounds whenever the panel opens, or on window resize while open
  const updateBounds = useCallback(() => {
    const button = buttonRef.current;
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      setDraggableBounds({
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: buttonRect.top - BUTTON_PANEL_GAP,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateBounds();

      const handleResize = () => updateBounds();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } else {
      setDraggableBounds(undefined);
    }
  }, [isOpen, updateBounds]);

  // After the panel renders and we know its real height, re-position it precisely above the button
  useEffect(() => {
    if (isOpen && panelRef.current && buttonRef.current) {
      // Use requestAnimationFrame to wait for the panel to render and get its actual height
      requestAnimationFrame(() => {
        const panelHeight = panelRef.current?.getBoundingClientRect().height;
        if (panelHeight) {
          resetToPosition(getPositionAboveButton(panelHeight));
        }
      });
    }
    // Only run when isOpen changes to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTogglePanel = () => {
    if (!isOpen) {
      // Position panel above the button using estimated height first;
      // the useEffect above will correct it once the panel renders.
      resetToPosition(getPositionAboveButton());
    }
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Fade transition state for tab switching
  const [tabVisible, setTabVisible] = useState(true);
  const [renderedTab, setRenderedTab] = useState<HelpCenterTab>(activeTab);

  const handleTabChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTab: HelpCenterTab | null
  ) => {
    if (newTab !== null && newTab !== activeTab) {
      // Fade out current content
      setTabVisible(false);
      // After fade-out completes, swap content and fade in
      setTimeout(() => {
        setActiveTab(newTab);
        setRenderedTab(newTab);
        setTabVisible(true);
      }, 150);
    }
  };

  const renderTabContent = () => {
    switch (renderedTab) {
      case "faqs":
        return <FAQTab currentStep={currentStep} />;
      case "guides":
        return <GuidesTab />;
      case "contact":
        return (
          <ContactTab
            currentStep={currentStep}
            projectId={projectId}
            projectName={projectName}
            onSubmitSuccess={() => {
              // Optionally close panel or show success state
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ position: "static" }}>
      {/* Floating "Need help" button - positioned relative to the modal Paper */}
      <Button
        ref={buttonRef}
        onClick={handleTogglePanel}
        variant="outlined"
        startIcon={<Question size={18} weight="fill" />}
        sx={{
          position: "absolute",
          bottom: 12,
          left: 16,
          zIndex: 1,
          backgroundColor: "#FFFFFF",
          color: theme.palette.text.primary,
          border: "1px solid #A3A3A3",
          textTransform: "none",
          fontWeight: 500,
          fontSize: "14px",
          lineHeight: "20px",
          borderRadius: "6px",
          px: 2,
          py: 0.75,
          minHeight: "36.5px",
          gap: "4px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
            "&:hover": {
              backgroundColor: "#F5F5F5",
              borderColor: "#737373",
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
            },
          "&:active": {
            backgroundColor: "#FFFFFF",
            borderColor: "#525252",
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
          },
          "&:focus-visible": {
            backgroundColor: "#FFFFFF",
            borderColor: "#A3A3A3",
            boxShadow: "0 0 0 4px #525252",
            outline: "none",
          },
          "& .MuiButton-startIcon": {
            marginRight: "1px",
          },
        }}
      >
        Need help
      </Button>

      {/* Draggable Help Panel - shown when open */}
      <Fade in={isOpen}>
        <Paper
          ref={panelRef}
          elevation={8}
          sx={{
            position: "fixed",
            left: position.x,
            top: position.y,
            width: PANEL_WIDTH,
            maxHeight: `calc(100vh - 48px)`,
            zIndex: theme.zIndex.modal + 2,
            borderRadius: "12px",
            overflow: "hidden",
            display: isOpen ? "flex" : "none",
            flexDirection: "column",
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          {/* Panel Header - Drag Handle */}
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DotsSixVertical
                size={16}
                weight="bold"
                color={theme.palette.text.secondary}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: "16px",
                  color: "text.primary",
                }}
              >
                How can we help you?
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <X size={18} />
            </IconButton>
          </Box>

          {/* Tab Navigation */}
          <Box sx={{ px: 2, pt: 2 }}>
            <ToggleButtonGroup
              value={activeTab}
              exclusive
              onChange={handleTabChange}
              aria-label="help center tabs"
              sx={{
                width: "100%",
                backgroundColor: theme.palette.grey[100],
                borderRadius: "8px",
                padding: "4px",
                "& .MuiToggleButtonGroup-grouped": {
                  border: "none",
                  borderRadius: "6px !important",
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "14px",
                  py: 0.75,
                  color: theme.palette.text.secondary,
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.grey[900],
                    color: "white",
                    "&:hover": {
                      backgroundColor: theme.palette.grey[800],
                    },
                  },
                  "&:hover": {
                    backgroundColor: theme.palette.grey[200],
                  },
                },
              }}
            >
              <ToggleButton value="faqs">FAQs</ToggleButton>
              <ToggleButton value="guides">Guides</ToggleButton>
              <ToggleButton value="contact">Contact us</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Tab Content - Scrollable with fade transition */}
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              opacity: tabVisible ? 1 : 0,
              transition: "opacity 150ms ease-in-out",
            }}
          >
            {renderTabContent()}
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default SupportHelpCenter;
export { SupportHelpCenter };
