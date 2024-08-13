import express, { Express, Request, Response } from "express";
import { config } from "dotenv";
import cors from "cors";
import * as k8s from "@kubernetes/client-node";
import { CRD, CRDData, CRDResult } from "./types/crd";

config();

const port = process.env.PORT || 3000;
const app: Express = express();
app.use(express.json());
app.use(
  "*",
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const createRoutes = () => {
  app.get(
    "/crds",
    async (req: Request, res: Response): Promise<Response<CRDData[]>> => {
      try {
        if (!process.env.KBLOCKS_CONFIG_MAP_ANNOTATION) {
          throw { message: "KBLOCKS_CONFIG_MAP_ANNOTATION is not set" };
        }
        if (!process.env.KBLOCKS_NAMESPACE) {
          throw { message: "KBLOCKS_NAMESPACE is not set" };
        }
        const k8sCRDApi = kc.makeApiClient(k8s.ApiextensionsV1Api);
        const crds = await k8sCRDApi.listCustomResourceDefinition();
        const filteredCrds = crds.body.items.filter(
          (crd) => crd.spec.group === process.env.KBLOCKS_GROUP_NAME,
        );

        const crdsResult: CRDData[] = [];

        for (const crd of filteredCrds) {
          const result: CRDData = {
            kind: crd.spec.names.kind,
          };
          if (crd?.metadata?.annotations) {
            const configmapName =
              crd.metadata.annotations[
                process.env.KBLOCKS_CONFIG_MAP_ANNOTATION
              ];
            const k8sConfigMapApi = kc.makeApiClient(k8s.CoreV1Api);
            const configMap = await k8sConfigMapApi.readNamespacedConfigMap(
              configmapName,
              process.env.KBLOCKS_NAMESPACE,
            );
            const crdConfigMap = configMap.body.data;
            result.color = crdConfigMap?.color;
            result.icon = crdConfigMap?.icon?.replace("heroicon://", "");
            result.readme = crdConfigMap?.readme;
            crdsResult.push(result);
          }
        }
        return res.status(200).json(crdsResult);
      } catch (error) {
        console.error(error);
        return res.sendStatus(500);
      }
    },
  );

  app.get(
    "/configmaps:name",
    async (req: Request, res: Response): Promise<Response<CRDResult[]>> => {
      const configmapName = req.params.name;
      const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
      try {
        if (!process.env.KBLOCKS_NAMESPACE) {
          return res
            .status(500)
            .json({ message: "KBLOCKS_NAMESPACE is not set" });
        }
        const configMap = await k8sApi.readNamespacedConfigMap(
          configmapName,
          process.env.KBLOCKS_NAMESPACE,
        );
        const crdConfigMap = configMap.body.data;
        return res.status(200).json(crdConfigMap);
      } catch (error) {
        console.error(error);
        return res.sendStatus(500);
      }
    },
  );

  app.get(
    "/argo-apps",
    async (req: Request, res: Response): Promise<Response<CRD[]>> => {
      try {
        const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);
        const group = "argoproj.io"; // Argo CD CRDs are under the group 'argoproj.io'
        const version = "v1alpha1"; // Argo CD Application CRDs are usually versioned as 'v1alpha1' or 'v1beta1'
        const namespace = "default"; // Replace with the namespace where your Argo CD applications are deployed
        const plural = "applications"; // The plural name of the resource
        console.log("Listing Argo CD applications:");
        const apps = await k8sApi.listNamespacedCustomObject(
          group,
          version,
          namespace,
          plural,
        );
        console.log(apps.body);
        return res.status(200).json(apps);
      } catch (error) {
        console.error(error);
        return res.sendStatus(500);
      }
    },
  );

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

createRoutes();
