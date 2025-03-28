// import { type RouteConfig, index } from "@react-router/dev/routes"
// export default [
//   // index("routes/Home/index.tsx"),
//   // route("/addbanca", "routes/ExaminingBoard/index.tsx"),
//   // route("/login", "routes/Login/index.tsx"),
//   // route("/register", "routes/Register/index.tsx"),
//   // route("/account", "routes/AccountSettings/index.tsx"),
//   // route("/dashboard", "routes/Dashboard/index.tsx"),
//   // route("/verbanca", "routes/ViewBanca/index.tsx"),
//   // route("/addition", "routes/Addition/index.tsx"),
//   // route("/settings", "routes/Settings/index.tsx"),
//   // route("/users", "routes/Users/index.tsx"),
//   // route("/editarbanca/:id", "routes/ViewBoard/index.tsx"),
//   // route("/resetpass", "routes/ResetPassword/index.tsx"),
//   // route("/experimento", "routes/Evaluation/Evaluation.tsx"),
// ] satisfies RouteConfig
import { type RouteConfig } from "@react-router/dev/routes"
import { flatRoutes } from "@react-router/fs-routes"

// https://reactrouter.com/7.2.0/how-to/file-route-conventions
export default flatRoutes() satisfies RouteConfig

