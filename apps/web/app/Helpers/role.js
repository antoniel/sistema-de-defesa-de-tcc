export function isTeacher() {
  return localStorage.getItem("role") === "3";
}
