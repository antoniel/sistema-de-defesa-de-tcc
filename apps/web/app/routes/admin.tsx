import { useUser } from "@/services/useUser"
import { Navigate, Outlet } from "react-router"
import { useEffect, useState } from "react"
import type { Route } from "./+types/admin"

export const meta: Route.MetaFunction = () => [
  { title: "SISDEF - Administração" },
]

export default function AdminLayout() {
  const [isClient, setIsClient] = useState(false)
  const { data: user, isLoading, isError } = useUser()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || isLoading) {
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
