import { CommonLayout } from "../layouts";
import { Login, Register, Error404 } from "../pages/common";

const routesCommon = [
  {
    path: "/login",
    layout: CommonLayout,
    component: Login,
  },
  {
    path: "/register",
    layout: CommonLayout,
    component: Register,
  },
  {
    path: "*",
    layout: CommonLayout,
    component: Error404,
  },
];

export default routesCommon;
