# SPEC — contrato da skill secure-app

## Garantias

1. **Toda afirmação do relatório tem evidência**: dado primário, execução reproduzível ou
   referência cruzada entre fontes independentes. Se uma fonte de dados for detectada como
   não confiável (respostas que não variam com a versão, detalhes vazios, incoerência com o
   registro primário), ela é descartada e a divergência fica registrada no relatório.
2. **Toda correção aplicada mantém a suíte verde** nas condições de validação do projeto
   (typecheck, testes, e2e no modo CI). Patch que não consegue isso não é aplicado — vira
   work item.
3. **Classificação de risco por contexto**: um achado só é "explorável aqui" com o caminho de
   exploração escrito no relatório (pré-condições + passos). Sem caminho, é "teórico/deferido".
4. **Não há mutação silenciosa**: correção aplicada aparece no diff e no relatório final
   (antes → depois); nada é commitado pela skill.
5. **Reporte de fontes**: o relatório diz de onde vieram os dados de vulnerabilidade e como
   foram validados.

## Não-objetivos

- Não substitui ferramentas de scanning contínuo (Snyk, Dependabot, etc.) — complementa com
  triagem de contexto, que ferramentas genéricas não fazem.
- Não explora ativamente sistemas de terceiros; proof-of-concept fica no ambiente local do projeto.
- Não inventa CVE, severidade ou versão de correção: cita o ID do advisory e a fonte.
- Não executa `git commit`/`git push`.

## Aditividade (módulos)

- Um módulo é um diretório em `modules/<nome>/` com `MODULE.md` (metodologia) e,
  se necessário, `references/` e `report-template.md`.
- O `SKILL.md` mantém apenas a tabela de dispatch e as regras comuns — detalhe metodológico
  vive no módulo, para que módulos possam evoluir sem colisão.
- Um módulo NÃO pode: editar outro módulo, alterar regras comuns sem atualizar todos,
  nem pressupor ecossistema específico (Node/PHP/Rust/…​) no seu texto — a variação por
  linguagem fica em blocos "por ecossistema" dentro das referências do módulo.

## Fronteira de responsabilidade

- A skill decide **o quê** e **por quê** (triagem, ordem, risco).
- O usuário decide **quando** aplicar além do working tree (commit, deploy, upgrade breaking).
- Perguntas de produto ("aceitamos este risco?") são devolvidas ao usuário com dados, não
  respondidas pela skill.
