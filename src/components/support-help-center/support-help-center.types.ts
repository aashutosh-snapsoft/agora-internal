export type HelpCenterStep =
  | 'upload'
  | 'income-statement'
  | 'balance-sheet'
  | 'financial-model'
  | 'export';

export type HelpCenterTab = 'faqs' | 'guides' | 'contact';

export interface SupportHelpCenterProps {
  /** Current step in the upload wizard - determines which FAQs to show */
  currentStep: HelpCenterStep;
  /** Project ID for auto-populating contact form */
  projectId?: string;
  /** Project name for context in contact form */
  projectName?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQData {
  [key: string]: {
    questions: FAQItem[];
  };
}

export interface ContactFormData {
  name: string;
  email: string;
  projectId: string;
  subject: string;
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export interface FAQTabProps {
  currentStep: HelpCenterStep;
}

export type GuidesTabProps = Record<string, never>;

export interface ContactTabProps {
  currentStep?: HelpCenterStep;
  projectId?: string;
  projectName?: string;
  onSubmitSuccess?: () => void;
}
