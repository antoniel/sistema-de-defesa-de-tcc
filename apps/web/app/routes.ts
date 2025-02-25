import { type RouteConfig, index, route } from "@react-router/dev/routes"
export default [
  index("routes/Home.tsx"),
  route("/addbanca", "routes/ExaminingBoard/index.js"),
  route("/login", "routes/Login/index.js"),
  route("/register", "routes/Register/index.js"),
  route("/account", "routes/AccountSettings/index.js"),
  route("/dashboard", "routes/Dashboard/index.js"),
  route("/verbanca", "routes/ViewBanca/index.js"),
  route("/addition", "routes/Addition/index.js"),
  route("/settings", "routes/Settings/index.jsx"),
  route("/users", "routes/Users/index.js"),
  route("/editarbanca/:id", "routes/ViewBoard/index.js"),
  route("/resetpass", "routes/ResetPassword/index.js"),
  route("/experimento", "routes/Evaluation/Evaluation.jsx"),
] satisfies RouteConfig
