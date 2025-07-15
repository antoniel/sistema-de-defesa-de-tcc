import { useUser } from "@/services/useUser"
import { Navigate, Outlet } from "react-router"
import type { Route } from "./+types/admin"

export const meta: Route.MetaFunction = () => [
  { title: "SISDEF - Administração" },
]

export default function AdminLayout() {
  const { data: user, isLoading, isError } = useUser()

  if (isLoading) {
    return <div className="p-8 flex justify-center">Carregando...</div>
  }
  if (isError || !user) {
    return <Navigate to="/" />
  }
  if (user.role !== "ADMIN") {
    return <Navigate to="/" />
  }
  return <Outlet />
}
