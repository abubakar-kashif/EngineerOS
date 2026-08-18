import { apiRequest } from "./api";

export interface Resource {
  id: string;
  title: string;
  type: string;
  description: string;
  url?: string | null;
}

export interface ResourceListResponse {
  items: Resource[];
  total: number;
}

export async function getResources(): Promise<ResourceListResponse> {
  return apiRequest<ResourceListResponse>("/resources");
}

export async function getResourceById(
  resourceId: string,
): Promise<Resource> {
  return apiRequest<Resource>(`/resources/${resourceId}`);
}