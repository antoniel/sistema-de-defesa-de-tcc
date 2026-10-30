import crypto from "crypto"

export const generateResetToken = (): string => crypto.randomBytes(32).toString("hex")

export const hashResetToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex")

export const resetTokenHashesMatch = (a: string | null | undefined, b: string | null | undefined): boolean => {
  if (!a || !b) {
    return false
  }
  const left = Buffer.from(a, "utf8")
  const right = Buffer.from(b, "utf8")
  if (left.length !== right.length) {
    return false
  }
  return crypto.timingSafeEqual(left, right)
}
