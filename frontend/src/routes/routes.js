import routesClient from "./routes.client";
import routesAdmin from "./routes.admin";
import routesCommon from "./routes.common";

export const routes = [...routesAdmin, ...routesClient, ...routesCommon];
