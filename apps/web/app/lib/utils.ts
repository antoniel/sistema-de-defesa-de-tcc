import { clsx, type ClassValue } from "clsx"
import type { ClientResponse } from "hono/client"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TODO = <const T>(_: T & { __brand: "TODO" }) => {}

export type RpcType<T extends (...args: any[]) => any> = {
  input: Parameters<T>[0]
  output: Awaited<ReturnType<T>>["json"]
}
export const rpcReturn = async (clientResponse: ClientResponse<any, any, any>) => {
  const data = await clientResponse.json()
  if (!clientResponse.ok) {
    throw new Error(data.message)
  }
  return data
}
