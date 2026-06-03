export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  points: number;
  milestone: 'Novice' | 'Athlete' | 'Champion';
  region?: string;
  phone?: string;
  city?: string;
  deviceId?: number;
  streak?: number;
}

export interface Task {
  id: number;
  name: string;
  description: string;
  requiredTags: string[];
  steps: number;
  points: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: number;
  name: string;
  manufacturer: string;
  tags: string[];
  assignedUserIds?: number[];
}

export interface Challenge {
  id: number;
  name: string;
  description: string;
  scope: 'GLOBAL' | 'REGIONAL' | 'FRIENDLY';
  status: 'ACTIVE' | 'CLOSED';
  taskId: number;
  region?: string;
  requiredTags: string[];
  startAt: string;
  endAt: string;
  participants: number[];
}

export interface Telemetry {
  id: number;
  userId: number;
  stepCount: number;
  heartRate: number;
  calories: number;
  distance: number;
  submittedAt: string;
  tagValues?: { [tag: string]: any };
}

export interface Badge {
  id: number;
  userId: number;
  name: string;
  description: string;
  earnedDate: string;
  challengeId?: number;
}
