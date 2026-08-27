"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { H5 } from '@/external/essence/components/typography';

interface FAQData {
    title: string;
    sections: {
        id: string;
        title: string;
        questions: {
            id: string;
            question: string;
            answer: string;
        }[];
    }[];
}

interface FaqSectionProps {
    faqData: FAQData;
}

const FaqSection: React.FC<FaqSectionProps> = ({ faqData }) => {
    const theme = useTheme();
    const [expandedSection, setExpandedSection] = useState<string | false>(false);
    const [expandedQuestion, setExpandedQuestion] = useState<string | false>(false);

    const handleSectionChange = (sectionId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedSection(isExpanded ? sectionId : false);
        // Close all questions when section collapses
        if (!isExpanded) {
            setExpandedQuestion(false);
        }
    };

    const handleQuestionChange = (questionId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedQuestion(isExpanded ? questionId : false);
    };

    return (
        <Card
            sx={{
                mt: 3,
                boxShadow: theme.shadows[4],
                borderRadius: 2,
                border: `1px solid ${theme.palette.grey[200]}`,
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <H5
                    fontSize={20}
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 3
                    }}
                >
                    {faqData.title}
                </H5>
                
                {faqData.sections.map((section) => (
                    <Accordion
                        key={section.id}
                        expanded={expandedSection === section.id}
                        onChange={handleSectionChange(section.id)}
                        sx={{
                            mb: 2,
                            boxShadow: 'none',
                            border: `1px solid ${theme.palette.grey[200]}`,
                            borderRadius: '8px !important',
                            '&:before': {
                                display: 'none',
                            },
                            '&.Mui-expanded': {
                                margin: '0 0 16px 0',
                            },
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{
                                backgroundColor: theme.palette.grey[50],
                                borderRadius: '8px',
                                '&.Mui-expanded': {
                                    borderBottomLeftRadius: 0,
                                    borderBottomRightRadius: 0,
                                },
                                '& .MuiAccordionSummary-content': {
                                    margin: '16px 0',
                                },
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    fontSize: '16px',
                                }}
                            >
                                {section.title}
                            </Typography>
                        </AccordionSummary>
                        
                        <AccordionDetails sx={{ p: 0 }}>
                            <Box sx={{ p: 2 }}>
                                {section.questions.map((question) => (
                                    <Accordion
                                        key={question.id}
                                        expanded={expandedQuestion === question.id}
                                        onChange={handleQuestionChange(question.id)}
                                        sx={{
                                            mb: 1,
                                            boxShadow: 'none',
                                            border: `1px solid ${theme.palette.grey[100]}`,
                                            borderRadius: '6px !important',
                                            '&:before': {
                                                display: 'none',
                                            },
                                            '&.Mui-expanded': {
                                                margin: '0 0 8px 0',
                                            },
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMore />}
                                            sx={{
                                                minHeight: '48px',
                                                '& .MuiAccordionSummary-content': {
                                                    margin: '8px 0',
                                                },
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: 'text.primary',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                {question.question}
                                            </Typography>
                                        </AccordionSummary>
                                        
                                        <AccordionDetails>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'text.secondary',
                                                    fontSize: '14px',
                                                    lineHeight: 1.6,
                                                    whiteSpace: 'pre-line',
                                                }}
                                            >
                                                {question.answer}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </CardContent>
        </Card>
    );
};

export default FaqSection;
