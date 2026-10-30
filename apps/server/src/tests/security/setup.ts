/**
 * Setup dos testes de segurança.
 *
 * Roda via `setupFiles` ANTES de qualquer import dos testes, garantindo que
 * `config/env.ts` (avaliado na importação do app) entre em modo `test` —
 * sem exigir DATABASE_URL/SMTP — e que o JWT use um secret de teste.
 */
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "security-tests-secret-do-not-use-in-prod"
