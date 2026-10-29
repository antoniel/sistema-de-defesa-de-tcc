/**
 * Extrai a mensagem acionável de um erro vindo da API via cliente Hono RPC.
 *
 * O cliente (`hc`) lança `DetailedError` para respostas não-2xx: o
 * `error.message` é só "400 Bad Request" — o corpo JSON do servidor
 * (`{ message }`) vem em `error.detail.data.message`. Sem este helper os
 * formulários mostram "400 Bad Request" ao usuário, que não sabe o que
 * corrigir.
 */
export const getServerErrorMessage = (error: unknown, fallback = "Ocorreu um erro. Tente novamente."): string => {
  if (!(error instanceof Error)) return fallback

  const detail = (error as { detail?: { data?: { message?: unknown } } }).detail
  const serverMessage = detail?.data?.message
  if (typeof serverMessage === "string" && serverMessage.length > 0) return serverMessage

  const cause = (error as { cause?: unknown }).cause
  if (cause instanceof Error && cause.message) return cause.message

  return fallback
}
