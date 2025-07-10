// Export all centralized hooks
export * from "./banca.hooks"
export * from "./user.hooks"
export * from "./cursos.hooks"

// Re-export existing hooks
export { useToast } from "./use-toast"
export { default as useIsTeacher } from "./use-role"
export { useIsMobile } from "./use-mobile"
export { useQueryParamsState } from "./use-query-param-state"