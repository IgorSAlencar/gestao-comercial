import { RouteObject } from "react-router-dom";
import { HotlistGestao } from "./pages/HotlistGestao";
import { HotlistAll } from "./pages/HotlistAll";
import { HotlistProspectados } from "./pages/HotlistProspectados";
import { HotlistTratados } from "./pages/HotlistTratados";

export const hotlistRoutes: RouteObject[] = [
  {
    path: "/hotlist",
    children: [
      {
        path: "gestao",
        element: <HotlistGestao />,
      },
      {
        path: "all",
        element: <HotlistAll />,
      },
      {
        path: "prospectados",
        element: <HotlistProspectados />,
      },
      {
        path: "tratados",
        element: <HotlistTratados />,
      },
    ],
  },
]; 