import { AdminLayout } from "../layouts";
import { Dashboard } from "../pages/admin";

const routesAdmin = [
  {
    path: "/dashboard",
    layout: AdminLayout,
    component: Dashboard,
  },
];

export default routesAdmin;
