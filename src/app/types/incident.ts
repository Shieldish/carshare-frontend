// src/app/types/incident.ts

export type IncidentStatus =
  | 'REPORTED'
  | 'INVESTIGATING'
  | 'AWAITING_INFO'
  | 'RESOLUTION_PROPOSED'
  | 'RESOLVED'
  | 'CLOSED_UNRESOLVED';

export interface CreateIncidentData {
  incidentTimestamp: string; // ISO string
  description: string;
  location: string;
  photoUrls: string[];
}

export interface IncidentReportDetails {
  id: number;
  bookingId: number;
  reporterId: number;
  reporterFirstName?: string;
  incidentTimestamp: string; // ISO string
  description: string;
  location: string;
  photoUrls: string[];
  status: IncidentStatus;
  reportedAt: string; // ISO string
  resolutionNotes?: string;
  resolvedAt?: string; // ISO string
}