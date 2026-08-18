import { apiRequest } from "./api";

export interface Report {
  id: number;
  experiment_id: string;
  title: string;
  observations: string;
  conclusion: string;
  status: string;
}

export interface CreateReportRequest {
  experiment_id: string;
  title: string;
  observations: string;
  conclusion: string;
}

export async function getReports(): Promise<Report[]> {
  return apiRequest<Report[]>("/reports");
}

export async function getReportById(
  reportId: number,
): Promise<Report> {
  return apiRequest<Report>(`/reports/${reportId}`);
}

export async function createReport(
  data: CreateReportRequest,
): Promise<Report> {
  return apiRequest<Report>("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}