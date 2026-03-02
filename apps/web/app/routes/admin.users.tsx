import { Outlet } from "react-router"
import type { Route } from "./+types/admin.users"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Gerenciar Usuários" }]

export default function AdminUsersLayout() {
  return <Outlet />
}
