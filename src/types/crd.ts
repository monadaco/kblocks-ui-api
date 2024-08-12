export interface CRDResult {
  kind: string;
  configMapName?: string;
}

export interface CRDData {
  kind: string;
  readme?: string;
  icon?: string;
  color?: string;
}

export interface CRD {
  apiVersion: string;
  kind: string;
  metadata: {
    annotations: Record<string, string>;
    creationTimestamp: string;
    generation: number;
    labels: Record<string, string>;
    name: string;
    resourceVersion: string;
    uid: string;
  };
  spec: {
    conversion: Record<string, string>;
    group: string;
    names: {
      kind: string;
      listKind: string;
      plural: string;
      singular: string;
    };
    scope: string;
    versions: {
      additionalPrinterColumns: {
        description: string;
        jsonPath: string;
        name: string;
        type: string;
      }[];
      name: string;
      schema: {
        openAPIV3Schema: {
          properties: Record<string, any>;
        };
      };
      served: boolean;
      storage: boolean;
      subresources: {
        status: Record<string, string>;
      };
    };
    status: {
      acceptedNames: {
        kind: string;
        listKind: string;
        plural: string;
        singular: string;
      };
      conditions: {
        lastTransitionTime: string;
        message: string;
        reason: string;
        status: string;
        type: string;
      }[];
      storedVersions: string[];
    };
  };
}
