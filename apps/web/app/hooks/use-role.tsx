import { useUser } from "@/services/useUser"

const useIsTeacher = () => {
  const userQuery = useUser()
  return userQuery.data?.role === "teacher"
}

const useIsStudent = () => {
  const userQuery = useUser()
  return userQuery.data?.role === "student"
}

export default useIsTeacher
