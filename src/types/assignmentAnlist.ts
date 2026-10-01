// src/types/assignment.types.ts
import { Client } from './client.-types';
import { Locations } from './location.types';

export interface AnalystUser {
  id: number;
  name: string;
  email?: string;
}

export interface ClientLocationRelation {
  id: number;
  clientId: number;
  locationId: number;
  client?: Client;
  location?: Locations;
}

export interface Assignment {
  id: number;
  clientLocationId: number;
  analystId: number;
  createdAt: string;
  updatedAt?: string;
  analyst?: AnalystUser;
  clientLocation?: ClientLocationRelation;
}

export interface CreateAssignmentInput {
  analystId: number;
  clientId: number;
  locationId: number;
}