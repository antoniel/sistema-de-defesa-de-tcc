import { useUser } from "@/services/useUser"

const useIsTeacher = () => {
  const userQuery = useUser()
  return userQuery.data?.role === "TEACHER" || userQuery.data?.role === "ADMIN"
}

const useIsStudent = () => {
  const userQuery = useUser()
  return userQuery.data?.role === "STUDENT"
}

export default useIsTeacher
