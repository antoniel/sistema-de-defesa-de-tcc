import { describe, expect, it } from "vitest"
import { createStudentInvitationEmail, createTeacherInvitationEmail } from "."

const inviter = { nome: "Fred Durão", email: "fred@ufba.br" }

describe("templates de convite", () => {
  it("convite de professor mostra quem convidou e a data de expiração", () => {
    const html = createTeacherInvitationEmail({
      nome: "Eduardo",
      invitationUrl: "https://banca.test/teacher-invitation/abc",
      invitedBy: inviter,
      expiresAt: new Date("2026-11-04T13:24:00Z"),
    })

    expect(html).toContain("<strong>Fred Durão</strong> convidou você")
    expect(html).toContain("mailto:fred@ufba.br")
    expect(html).toContain("04/11/2026")
    expect(html).toContain("peça um novo convite a Fred Durão")
    expect(html).toContain('href="https://banca.test/teacher-invitation/abc"')
  })

  it("convite de professor sem remetente usa o texto genérico", () => {
    const html = createTeacherInvitationEmail({ nome: "Eduardo", invitationUrl: "https://banca.test/x" })

    expect(html).toContain("Você foi convidado(a) para participar do Sistema Banca como professor(a).")
    expect(html).not.toContain("Convidado por")
  })

  it("convite de aluno mostra quem convidou", () => {
    const html = createStudentInvitationEmail({ nome: "Ana", invitationUrl: "https://banca.test/s", invitedBy: inviter })

    expect(html).toContain("<strong>Fred Durão</strong> convidou você para participar do Sistema Banca como aluno(a).")
  })

  it("escapa HTML nos nomes", () => {
    const html = createTeacherInvitationEmail({
      nome: "<script>x</script>",
      invitationUrl: "https://banca.test/x",
      invitedBy: { nome: "<b>Mal</b>", email: "a@b.c" },
    })

    expect(html).not.toContain("<script>")
    expect(html).not.toContain("<b>Mal</b>")
    expect(html).toContain("&lt;b&gt;Mal&lt;/b&gt;")
  })
})
