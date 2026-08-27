"use client";

import React from "react";
import {
    Box,
    Container,
    Typography,
    Card,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import { Lifebuoy } from "@phosphor-icons/react";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
import { LoadingScreen } from "@/components/loading-screen";
import { ALERT_MESSAGES } from "@/lib/content/alert-messages";
// CUSTOM COMPONENTS
import { FlexBox } from "@/external/essence/components/flexbox";
import { H5 } from "@/external/essence/components/typography";

export default function SupportPage() {
    const theme = useTheme();
    const { authenticatedUser } = useAppSelector(userSelector);
    const [selectedSubject, setSelectedSubject] = React.useState("general-support");
    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        message: ""
    });
    const [errors, setErrors] = React.useState({
        name: "",
        subject: "",
        message: ""
    });
    const [touched, setTouched] = React.useState({
        name: false,
        subject: false,
        message: false
    });
    const [showSuccessModal, setShowSuccessModal] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    if (!authenticatedUser) {
        return <LoadingScreen />;
    }

    // Default receiver email
    const getReceiverEmail = () => {
        return "support@socratics.ai";
    };

    const validateField = (field: string, value: string) => {
        let error = "";
        switch (field) {
            case "name":
                if (!value.trim()) {
                    error = "Name is required!";
                }
                break;
            case "subject":
                if (!value) {
                    error = "Subject is required!";
                }
                break;
            case "message":
                if (!value.trim()) {
                    error = "Message is required!";
                }
                break;
        }
        return error;
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    const handleSubjectChange = (value: string) => {
        setSelectedSubject(value);

        // Clear error when user selects a subject
        if (errors.subject) {
            setErrors(prev => ({
                ...prev,
                subject: ""
            }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));

        // Validate field on blur
        const value = field === "subject" ? selectedSubject : formData[field as keyof typeof formData];
        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const nameError = validateField("name", formData.name);
        const subjectError = validateField("subject", selectedSubject);
        const messageError = validateField("message", formData.message);

        const newErrors = {
            name: nameError,
            subject: subjectError,
            message: messageError
        };

        setErrors(newErrors);

        // Mark all fields as touched
        setTouched({
            name: true,
            subject: true,
            message: true
        });

        // Check if there are any errors
        if (nameError || subjectError || messageError) {
            return;
        }

        setIsSubmitting(true);

        try {
            const receiverEmail = getReceiverEmail();
            const userEmail = formData.email || authenticatedUser?.email || "";

            // Send email using FormSubmit
            const response = await fetch(`https://formsubmit.co/ajax/${receiverEmail}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: receiverEmail,
                    name: formData.name,
                    subject: `Support Request: ${selectedSubject}`,
                    message: `Name: ${formData.name}\nEmail: ${receiverEmail}\nSubject: ${selectedSubject}\n\nMessage:\n${formData.message}`,
                    _replyto: userEmail,
                    _cc: userEmail
                })
            });

            if (response.ok) {
                setShowSuccessModal(true);
                setFormData({ name: "", email: "", message: "" });
                setSelectedSubject("");
            } else {
                throw new Error('Failed to send email');
            }

        } catch (error) {
            console.error('Email error:', error);
            alert(ALERT_MESSAGES.SUPPORT_SEND_FAILED.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
    };

    return (
        <>
            <Box sx={{ maxWidth: "800px", mx: "auto", py: 4 }}>
                <Container maxWidth={false}>
                    {/* Support Header - Full Width */}
                    <FlexBox
                        alignItems="center"
                        gap={2}
                        mb={3}
                        component="div"
                        sx={{
                            px: 2,
                            py: 1
                        }}
                    >
                        <Box
                            sx={{
                                ml: 1.5,
                                width: 40,
                                height: 40,
                                borderRadius: '12px', // Rounded square (squircle) instead of circle
                                backgroundColor: '#AFFF4866', // Same green as projects icon (brand[200])
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Lifebuoy size={20} color="#5E9C11" weight="duotone" />
                        </Box>
                        <H5
                            fontSize={20}
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary'
                            }}
                        >
                            Support
                        </H5>
                    </FlexBox>

                    {/* Product Documentation */}
                    <Card
                        sx={{
                            mb: 4,
                            boxShadow: theme.shadows[4],
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.grey[200]}`,
                            backgroundColor: theme.palette.background.paper,
                        }}
                    >
                        <Box sx={{ p: 4 }}>
                            <H5
                                fontSize={20}
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    mb: 3
                                }}
                            >
                                Guides
                            </H5>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Access step-by-step product guides in Notion knowledge base
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <Button
                                    variant="contained"
                                    component="a"
                                    href="https://socratics.notion.site/Guides-2d13c45d6b8480888a0ee2ece04516b9?source=copy_link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={
                                        <Box
                                            component="span"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '16px',
                                                fontFamily: 'serif',
                                                lineHeight: 1,
                                            }}
                                        >
                                            N
                                        </Box>
                                    }
                                    sx={{
                                        backgroundColor: theme.palette.grey[900],
                                        color: 'white',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        borderRadius: '8px',
                                        px: 2,
                                        py: 1,
                                        boxShadow: 'none',
                                        '&:hover': {
                                            backgroundColor: theme.palette.grey[800],
                                            boxShadow: 'none',
                                        }
                                    }}
                                >
                                    View product guides
                                </Button>
                            </Box>
                        </Box>
                    </Card>

                    {/* Contact Form */}
                    <Card
                        sx={{
                            mt: 3,
                            borderRadius: '16px',
                            boxShadow: '0px 1px 22px 0px #6B728014, 0px 4px 10px 0px #6B72800A, 0px 2px 5px -1px #6B728008',
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{ p: 4 }}>
                            <H5
                                fontSize={20}
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    mb: 3
                                }}
                            >
                                Contact Us
                            </H5>
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                                        <TextField
                                            fullWidth
                                            name="name"
                                            label="Name"
                                            variant="outlined"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            onBlur={() => handleBlur('name')}
                                            error={touched.name && !!errors.name}
                                            helperText={touched.name && errors.name}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    '& fieldset': {
                                                        borderColor: errors.name && touched.name ? '#EF4444' : '#E5E7EB',
                                                        borderWidth: '1px',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: errors.name && touched.name ? '#EF4444' : '#D1D5DB',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: errors.name && touched.name ? '#EF4444' : '#374151',
                                                        borderWidth: '2px',
                                                    },
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: errors.name && touched.name ? '#EF4444' : '#6B7280',
                                                    fontSize: '16px',
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: '16px',
                                                    padding: '12px 16px',
                                                },
                                                '& .MuiFormHelperText-root': {
                                                    color: '#EF4444',
                                                    fontSize: '14px',
                                                    marginLeft: 0,
                                                },
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                                        <TextField
                                            fullWidth
                                            name="email"
                                            label="Email"
                                            variant="outlined"
                                            value={formData.email || authenticatedUser?.email || ""}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            disabled
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    '& fieldset': {
                                                        borderColor: '#E5E7EB',
                                                        borderWidth: '1px',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: '#D1D5DB',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#374151',
                                                        borderWidth: '2px',
                                                    },
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: '#6B7280',
                                                    fontSize: '16px',
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: '16px',
                                                    padding: '12px 16px',
                                                },
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: '1 1 100%' }}>
                                        <FormControl fullWidth>
                                            <InputLabel
                                                sx={{
                                                    color: errors.subject && touched.subject ? '#EF4444' : '#6B7280',
                                                    fontSize: '16px',
                                                    '&.Mui-focused': {
                                                        color: errors.subject && touched.subject ? '#EF4444' : '#374151'
                                                    }
                                                }}
                                            >
                                                Subject
                                            </InputLabel>
                                            <Select
                                                value={selectedSubject}
                                                onChange={(e) => handleSubjectChange(e.target.value)}
                                                onBlur={() => handleBlur('subject')}
                                                label="Subject"
                                                error={touched.subject && !!errors.subject}
                                                sx={{
                                                    borderRadius: '12px',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: errors.subject && touched.subject ? '#EF4444' : '#E5E7EB',
                                                        borderWidth: '1px',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: errors.subject && touched.subject ? '#EF4444' : '#D1D5DB',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: errors.subject && touched.subject ? '#EF4444' : '#374151',
                                                        borderWidth: '2px',
                                                    },
                                                    '& .MuiSelect-select': {
                                                        fontSize: '16px',
                                                        padding: '12px 16px',
                                                    },
                                                }}
                                            >
                                                <MenuItem value="">Select a subject</MenuItem>
                                                <MenuItem value="general-support">General Support</MenuItem>
                                                <MenuItem value="upload">Upload</MenuItem>
                                                <MenuItem value="income-statement">Income Statement</MenuItem>
                                                <MenuItem value="balance-sheet">Balance Sheet</MenuItem>
                                                <MenuItem value="export">Export</MenuItem>
                                            </Select>
                                        </FormControl>
                                        {touched.subject && errors.subject && (
                                            <Typography
                                                variant="caption"
                                                color="#EF4444"
                                                sx={{
                                                    display: 'block',
                                                    mt: 0.5,
                                                    ml: 1.5,
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {errors.subject}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box sx={{ flex: '1 1 100%' }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            name="message"
                                            label="Message"
                                            variant="outlined"
                                            value={formData.message}
                                            onChange={(e) => handleInputChange('message', e.target.value)}
                                            onBlur={() => handleBlur('message')}
                                            error={touched.message && !!errors.message}
                                            helperText={touched.message && errors.message}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    '& fieldset': {
                                                        borderColor: errors.message && touched.message ? '#EF4444' : '#E5E7EB',
                                                        borderWidth: '1px',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: errors.message && touched.message ? '#EF4444' : '#D1D5DB',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: errors.message && touched.message ? '#EF4444' : '#374151',
                                                        borderWidth: '2px',
                                                    },
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: errors.message && touched.message ? '#EF4444' : '#6B7280',
                                                    fontSize: '16px',
                                                },
                                                '& .MuiInputBase-input': {
                                                    fontSize: '16px',
                                                    padding: '12px 16px',
                                                },
                                                '& .MuiFormHelperText-root': {
                                                    color: '#EF4444',
                                                    fontSize: '14px',
                                                    marginLeft: 0,
                                                },
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: '1 1 100%' }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="medium"
                                            disabled={isSubmitting}
                                            sx={{
                                                fontSize: '18px',
                                                fontWeight: 500,
                                                px: 2,

                                                borderRadius: '12px',
                                                backgroundColor: theme.palette.grey[900],
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.grey[800],
                                                },
                                                '&:disabled': {
                                                    opacity: 0.6
                                                }
                                            }}
                                        >
                                            {isSubmitting ? "Sending..." : "Send Message"}
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Card>
                </Container>
            </Box>

            {/* Success Modal */}
            {showSuccessModal && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                    onClick={closeSuccessModal}
                >
                    <Box
                        sx={{
                            backgroundColor: 'white',
                            padding: 4,
                            borderRadius: 2,
                            textAlign: 'center',
                            maxWidth: 400,
                            mx: 2,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h5" color="success.main" fontWeight="bold">
                                Message Sent
                            </Typography>
                        </Box>
                        <Typography variant="body1" color="text.secondary" mb={3}>
                            Your support request has been sent successfully. We&apos;ll get back to you soon.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={closeSuccessModal}
                            sx={{ minWidth: 120 }}
                        >
                            OK
                        </Button>
                    </Box>
                </Box>
            )}
        </>
    );
}
