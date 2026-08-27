"use client";

import { FC, useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import { PaperPlaneTilt, Phone, CheckCircle } from "@phosphor-icons/react";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
import {
  ContactTabProps,
  ContactFormData,
  ContactFormErrors,
  HelpCenterStep,
} from "./support-help-center.types";
import { ALERT_MESSAGES } from "@/lib/content/alert-messages";

// Jira Issue Collector - loaded directly from Atlassian
const JIRA_COLLECTOR_URL =
  "https://socraticsai.atlassian.net/s/d41d8cd98f00b204e9800998ecf8427e-T/-k8g762/b/0/b0105d975e9e59f24a3230a22972a71a/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs.js?locale=en-US&collectorId=2db46d93";
const JQUERY_CDN = "https://code.jquery.com/jquery-3.7.1.min.js";

// Script element IDs for cleanup/tracking
const JQUERY_SCRIPT_ID = "jquery-cdn-script";
const JIRA_SCRIPT_ID = "jira-collector-script";

// TypeScript declarations for Jira globals
declare global {
  interface Window {
    ATL_JQ_PAGE_PROPS?: {
      triggerFunction?: (showCollectorDialog: () => void) => void;
      fieldValues?: {
        fullname?: string;
        email?: string;
        summary?: string;
        description?: string;
      };
    };
    jQuery?: any;
  }
}

// Helper to load external scripts with caching
const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${id}`));
    document.head.appendChild(script);
  });
};

// Helper to remove a script by ID
const removeScript = (id: string): void => {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
};

const subjectForStep: Record<HelpCenterStep, string> = {
  upload: "Upload",
  "income-statement": "Income Statement",
  "balance-sheet": "Balance Sheet",
  "financial-model": "Financial Model",
  export: "Export",
};

const ContactTab: FC<ContactTabProps> = ({
  currentStep,
  projectId,
  projectName,
  onSubmitSuccess,
}) => {
  const theme = useTheme();
  const { authenticatedUser } = useAppSelector(userSelector);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    projectId: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-populate form fields
  useEffect(() => {
    if (authenticatedUser) {
      setFormData((prev) => ({
        ...prev,
        name:
          prev.name ||
          `${authenticatedUser.first_name || ""} ${authenticatedUser.last_name || ""}`.trim(),
        email: prev.email || authenticatedUser.email || "",
      }));
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (projectId) {
      setFormData((prev) => ({
        ...prev,
        projectId: projectId,
      }));
    }
  }, [projectId]);

  // Autofill subject based on which page the user opened help from
  useEffect(() => {
    if (currentStep) {
      setFormData((prev) => ({
        ...prev,
        subject: subjectForStep[currentStep],
      }));
    }
  }, [currentStep]);

  const validateField = (field: keyof ContactFormData, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Name is required";
        break;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        break;
      case "subject":
        if (!value.trim()) return "Subject is required";
        break;
      case "message":
        if (!value.trim()) return "Message is required";
        break;
    }
    return undefined;
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof ContactFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    
    // Clear submit states on new input
    if (submitSuccess) setSubmitSuccess(false);
    if (submitError) setSubmitError(null);
  };

  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};
    let isValid = true;

    (["name", "email", "subject", "message"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({ name: true, email: true, subject: true, message: true });
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Step 1: Load jQuery if not already loaded
      if (!window.jQuery) {
        await loadScript(JQUERY_CDN, JQUERY_SCRIPT_ID);
      }

      // Step 2: Remove existing Jira collector (to re-initialize with new values)
      removeScript(JIRA_SCRIPT_ID);

      // Step 3: Build description with all context
      const formattedDescription = [
        "--- Reporter Info ---",
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        "",
        "--- Project Context ---",
        `Project ID: ${formData.projectId || "N/A"}`,
        `Project Name: ${projectName || "N/A"}`,
        "",
        "--- Subject ---",
        formData.subject,
        "",
        "--- Message ---",
        formData.message,
      ].join("\n");

      // Step 4: Set up Jira with field values BEFORE loading script
      window.ATL_JQ_PAGE_PROPS = {
        triggerFunction: (showCollectorDialog: () => void) => {
          // Jira is ready - open the dialog
          setIsSubmitting(false);
          showCollectorDialog();
        },
        fieldValues: {
          fullname: formData.name,
          email: formData.email,
          summary: formData.subject,
          description: formattedDescription,
        },
      };

      // Step 5: Load Jira collector script (reads fieldValues during init)
      await loadScript(JIRA_COLLECTOR_URL, JIRA_SCRIPT_ID);

      // Note: Dialog opens via triggerFunction callback above
      // Don't reset form here - user might cancel Jira dialog

    } catch (error) {
      console.error("Failed to open support form:", error);
      setSubmitError(ALERT_MESSAGES.SUPPORT_FORM_OPEN_FAILED.message);
      setIsSubmitting(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      fontSize: "14px",
      "& fieldset": {
        borderColor: theme.palette.grey[300],
      },
      "&:hover fieldset": {
        borderColor: theme.palette.grey[400],
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.grey[900],
        borderWidth: "1px",
      },
      "&.Mui-disabled": {
        backgroundColor: theme.palette.grey[100],
        "& fieldset": {
          borderColor: theme.palette.grey[200],
        },
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "14px",
      color: theme.palette.text.secondary,
      "&.Mui-focused": {
        color: theme.palette.grey[900],
      },
    },
    "& .MuiInputBase-input": {
      fontSize: "14px",
      padding: "10px 12px",
      "&.Mui-disabled": {
        color: theme.palette.text.secondary,
        WebkitTextFillColor: theme.palette.text.secondary,
      },
    },
    "& .MuiFormHelperText-root": {
      marginLeft: 0,
      fontSize: "12px",
    },
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {submitSuccess && (
        <Alert
          icon={<CheckCircle size={20} weight="fill" style={{ color: "#0D6B50" }} />}
          severity="success"
          sx={{
            mb: 1,
            backgroundColor: "#87CCB5",
            color: "#0D6B50",
            fontWeight: 400,
            fontSize: "14px",
            "& .MuiAlert-message": {
              fontWeight: 400,
              color: "#0D6B50",
            },
          }}
        >
          {ALERT_MESSAGES.SUPPORT_MESSAGE_SENT.message}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {submitError}
        </Alert>
      )}

      {/* Name Field */}
      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 0.5, fontSize: "14px", pl: "12px" }}
        >
          Name
        </Typography>
        <TextField
          fullWidth
          size="small"
          disabled
          placeholder="Enter your name"
          value={formData.name}
          sx={inputSx}
        />
      </Box>

      {/* Email Field */}
      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 0.5, fontSize: "14px", pl: "12px" }}
        >
          E-mail
        </Typography>
        <TextField
          fullWidth
          size="small"
          disabled
          placeholder="your.email@example.com"
          value={formData.email}
          sx={inputSx}
        />
      </Box>

      {/* Project ID Field */}
      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 0.5, fontSize: "14px", pl: "12px" }}
        >
          Project ID
        </Typography>
        <TextField
          fullWidth
          size="small"
          disabled
          placeholder="Enter project ID"
          value={formData.projectId}
          sx={inputSx}
        />
      </Box>

      {/* Subject Field */}
      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 0.5, fontSize: "14px", pl: "12px" }}
        >
          Subject
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter a subject"
          value={formData.subject}
          onChange={(e) => handleChange("subject", e.target.value)}
          onBlur={() => handleBlur("subject")}
          error={touched.subject && !!errors.subject}
          helperText={touched.subject && errors.subject}
          sx={inputSx}
        />
      </Box>

      {/* Message Field */}
      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 0.5, fontSize: "14px", pl: "12px" }}
        >
          Message
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Tell us more about your inquiry..."
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          onBlur={() => handleBlur("message")}
          error={touched.message && !!errors.message}
          helperText={touched.message && errors.message}
          sx={{
            ...inputSx,
            "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
              padding: "10px 12px",
            },
            "& .MuiInputBase-inputMultiline": {
              fontSize: "14px",
              padding: 0,
            },
          }}
        />
      </Box>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        startIcon={
          isSubmitting ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <PaperPlaneTilt size={16} weight="fill" />
          )
        }
        sx={{
          backgroundColor: theme.palette.grey[900],
          color: "white",
          textTransform: "none",
          fontWeight: 500,
          fontSize: "14px",
          borderRadius: "8px",
          py: 1.25,
          "&:hover": {
            backgroundColor: theme.palette.grey[800],
          },
          "&.Mui-disabled": {
            backgroundColor: theme.palette.grey[400],
            color: "white",
          },
        }}
      >
        {isSubmitting ? "Opening support form..." : "Send message"}
      </Button>

      {/* Phone Support Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          mt: 1,
        }}
      >
        <Phone size={20} weight="fill" color={theme.palette.text.secondary} />
        <Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontSize: "14px", color: "text.primary" }}
          >
            Phone support
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "14px", color: "text.secondary", mt: 0.25 }}
          >
            Mon-Fri, 9AM-5PM PST
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "14px", color: "#3B82F6", mt: 0.5, fontWeight: 500 }}
          >
            +1 (650) 391-0378
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ContactTab;
