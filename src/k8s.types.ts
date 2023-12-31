// kubernetes.types.ts

export interface AdmissionReview {
  apiVersion: string;
  kind: string;
  request: AdmissionRequest;
  response?: AdmissionResponse;
}

export interface AdmissionRequest {
  uid: string;
  kind: { kind: string; group: string; version: string };
  resource: { group: string; version: string; resource: string };
  subResource?: string;
  requestKind?: { kind: string; group: string; version: string };
  requestResource?: { group: string; version: string; resource: string };
  requestSubResource?: string;
  name?: string;
  namespace?: string;
  operation: string;
  userInfo: {
    username: string;
    uid: string;
    groups: string[];
    extra?: { [key: string]: { items: string[] } };
  };
  object?: any;
  oldObject?: any;
  dryRun?: boolean;
  options?: any;
}

export interface AdmissionResponse {
  uid: string;
  allowed: boolean;
  status?: { code: number; message: string };
  patch?: any[];
  patchType?: string;
}
