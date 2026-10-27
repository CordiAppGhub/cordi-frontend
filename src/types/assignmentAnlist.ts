// src/types/assignment.types.ts
export interface AnalystUser {
  id: number;
  name: string | null;
  email?: string;
}

export interface Assignment {
  id: number;
  clientId: number;
  analystId: number;
  createdAt: string;
  analyst?: AnalystUser;
  client?: { id: number; razonSocial: string; nit?: string };
  locations: { id: number; name: string }[];
}

export interface AnalystAssignmentGroup {
  id: number;
  analystName: string;
  clients: Assignment[];
}

export interface CreateAssignmentInput {
  analystId: number;
  clientId: number;
}

export interface DelegationResource {
  id: number;
  type?: string;
  status?: string;
  numeroPedido?: string | null;
  principalAnalyst?: AnalystUser | null;
  analyst?: AnalystUser | null;
  location?: { id: number; name: string };
}

export interface DelegationResources {
  locations: Array<{
    id: number;
    location: { id: number; name: string };
    principalAnalyst: AnalystUser | null;
  }>;
  operations: DelegationResource[];
}

export interface CreateDelegationInput {
  novedadId: number;
  clientId: number;
  analystId: number;
  locationIds?: number[];
  operationIds?: number[];
  reason: string;
  endsAt?: string;
}

export interface AnalystDelegation {
  id: number;
  clientId: number;
  principalAnalystId: number;
  delegateAnalystId: number;
  clientLocationId: number | null;
  operationId: number | null;
  novedadId: number | null;
  reason: string;
  startsAt: string;
  endsAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  client: { id: number; razonSocial: string; nit: string };
  principalAnalyst: AnalystUser;
  delegateAnalyst: AnalystUser;
  clientLocation: { location: { id: number; name: string } } | null;
  novedad: {
    id: number;
    category: string | null;
    description: string;
    status: string;
  } | null;
  operation: {
    id: number;
    type: string;
    status: string;
    numeroPedido: string | null;
  } | null;
}