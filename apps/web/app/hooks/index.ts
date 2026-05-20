// Export all centralized hooks
export * from "./banca.hooks"
export * from "./user.hooks"
export * from "./cursos.hooks"
export * from "./teacher-invitation.hooks"
export * from "./student-invitation.hooks"
export * from "./documento.hooks"
export * from "./calendar.hooks"

// Re-export existing hooks
export { useToast } from "./use-toast"
export { default as useIsTeacher } from "./use-role"
export { useIsMobile } from "./use-mobile"
export { useQueryParamsState } from "./use-query-param-state"