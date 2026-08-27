/**
 * Ergon Workflow API Types
 * Matches Ergon's Pydantic schemas from ergon/docs/QUICKSTART.md
 */

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface FinancialModelSubmitRequest {
  project_id: string;
  blob_url: string;
  sheet_name?: string;
  include_forecast?: boolean;
  forecast_periods?: number;
  forecast_scenarios?: string[];
}

export interface JobSubmitResponse {
  project_id: string;
  job_id: string;
  status: JobStatus;
  submitted_at: string;
  message: string;
  is_new: boolean;
}

export interface JobStatusResponse {
  project_id: string;
  job_id: string;
  status: JobStatus;
  submitted_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  error?: string;
  message: string;
}

export interface JobListResponse {
  jobs: JobStatusResponse[];
  total: number;
}

export interface JobListParams {
  status?: JobStatus;
  limit?: number;
}

