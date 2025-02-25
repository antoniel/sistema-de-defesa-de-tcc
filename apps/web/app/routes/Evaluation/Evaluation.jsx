import { Container } from "@material-ui/core";
import React from "react";

export default function Evaluation() {
  return (
    <Container maxWidth="md">
      <h1>Avaliação do Sistema de Defesas de TCC</h1>
      <p style={{ fontSize: 16, padding: "16px 0", textAlign: "justify" }}>
        Olá, me chamo <strong>João Pedro Brito Silva</strong>, aluno do curso de
        Bacharelado em Ciência da Computação e este projeto faz parte da
        disciplina de Projeto Final 2 orientada pelo Professor Frederico Durão.
        Desde já, agradeço pela participação voluntária neste experimento. A sua
        avaliação é de suma importância para o sucesso do trabalho proposto e
        levará apenas 5 minutos.
        <br />
        <br />
        O sistema tem como objetivo realizar todo o processo de marcação e
        gerenciamento de defesas de TCC dos cursos do Instituto de Computação,
        dar maior visibilidade aos trabalhos defendidos pelos alunos e facilitar
        a geração e emissão de certificados de participação para docentes e
        avaliadores. Para analisar se a ferramenta atende ao seu propósito
        corretamente, preciso da sua avaliação de acordo com as etapas a seguir:
        <br />
        <br />
        <strong>PASSO A PASSO:</strong>
        <ul>
          <li>
            Acesse a página do{" "}
            <a
              href="https://sistema-de-defesas.app.ic.ufba.br/"
              target="_blank"
              rel="noreferrer"
            >
              Sistema de Defesas de TCC
            </a>
          </li>
        </ul>
        <strong>Caso seja aluno:</strong>
        <ol>
          <li>Registre-se no sistema e faça login com a conta criada.</li>
          <li>
            Após o login, cadastre uma defesa de TCC. Pode utilizar dados
            fictícios ou cadastrar a sua própria caso já tenha defendido ou já
            possua os dados.
            <br />
            <strong>Importante:</strong> os estudantes podem iniciar o cadastro
            dos trabalhos, mas apenas os orientadores podem torná-los públicos.
            Após o cadastro da defesa, o (seu) orientador será notificado por
            e-mail para finalizar o cadastro.
          </li>
          <li>
            Acesse o seu perfil e verifique seus dados. Altere se necessário.
          </li>
          <li>
            Acesse a tela principal, e procure por outros trabalhos publicados.
          </li>
          <li>
            Obrigado! Para finalizar, ajude-nos a melhorar o sistema respondendo
            a um rápido questionário de avaliação disponível{" "}
            <a
              href="https://docs.google.com/forms/d/1_kGlkMi9KywxwHiVuBCyJt-vfgcb93MwXQUuNAEUL6U"
              target="_blank"
              rel="noreferrer"
            >
              aqui
            </a>
            .
          </li>
        </ol>
        <strong>Caso seja docente:</strong>
        <ol>
          <li>
            Acesse a tela de login e solicite a redefinição de senha com o seu
            e-mail UFBA. Este passo é necessário, já que docentes do IC foram
            pré cadastrados no sistema para a atribuição correta de suas
            permissões administrativas.
          </li>
          <li>
            Após redefinir sua senha, faça login e realize o cadastro de pelo
            menos uma defesa de TCC de algum aluno que você já orientou.
            Cadastre os componentes da banca avaliadora e insira as notas
            atribuídas por eles.{" "}
          </li>
          <li>
            Pesquise pela defesa do passo anterior ou por uma delas. Acesse uma,
            e realize o download dos relatórios de orientação e participação dos
            membros da banca. Verifique se as informações exibidas estão
            corretas.
          </li>
          <li>
            Obrigado! Para finalizar, ajude-nos a melhorar o sistema respondendo
            a um rápido questionário de avaliação disponível{" "}
            <a
              href="https://docs.google.com/forms/d/1_kGlkMi9KywxwHiVuBCyJt-vfgcb93MwXQUuNAEUL6U"
              target="_blank"
              rel="noreferrer"
            >
              aqui
            </a>
            .
          </li>
        </ol>
        Em caso de dúvidas ou sugestões, você pode entrar em contato direto
        comigo pelo e-mail <a href="mailto:j.brito@ufba.br.">j.brito@ufba.br</a>
        .
        <br />
        <p
          style={{ fontSize: "16px", textAlign: "center", fontWeight: "bold" }}
        >
          Obrigado pela sua participação!
        </p>
      </p>
    </Container>
  );
}
