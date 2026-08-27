"use client";

import { FC, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from "@mui/material";
import { CaretDown } from "@phosphor-icons/react";
import { FAQTabProps, FAQItem, FAQData } from "./support-help-center.types";

const FAQTab: FC<FAQTabProps> = ({ currentStep }) => {
  const theme = useTheme();
  const [expandedId, setExpandedId] = useState<string | false>(false);
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load FAQ data based on current step
  useEffect(() => {
    const loadFAQs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "/static/product-documentation/help-center-faqs.json"
        );
        const data: FAQData = await response.json();
        const stepFaqs = data[currentStep]?.questions || [];
        setFaqData(stepFaqs);
      } catch (error) {
        console.error("Failed to load FAQs:", error);
        setFaqData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFAQs();
  }, [currentStep]);

  const handleAccordionChange =
    (id: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedId(isExpanded ? id : false);
    };

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading FAQs...
        </Typography>
      </Box>
    );
  }

  if (faqData.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No FAQs available for this step.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {faqData.map((faq) => (
        <Accordion
          key={faq.id}
          expanded={expandedId === faq.id}
          onChange={handleAccordionChange(faq.id)}
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": {
              display: "none",
            },
            "&.Mui-expanded": {
              margin: 0,
            },
            borderBottom: `1px solid ${theme.palette.divider}`,
            "&:last-child": {
              borderBottom: "none",
            },
          }}
        >
          <AccordionSummary
            expandIcon={
              <CaretDown
                size={16}
                style={{
                  transform:
                    expandedId === faq.id ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease-in-out",
                }}
              />
            }
            sx={{
              px: 0,
              minHeight: "48px",
              "&.Mui-expanded": {
                minHeight: "48px",
              },
              "& .MuiAccordionSummary-content": {
                margin: "12px 0",
                "&.Mui-expanded": {
                  margin: "12px 0",
                },
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "text.primary",
                fontSize: "14px",
                lineHeight: 1.4,
              }}
            >
              {faq.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              px: 0,
              pt: 0,
              pb: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "14px",
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}
            >
              {faq.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default FAQTab;
