import api from "Config/http";
import { useState } from "react";
import { toast } from "react-toastify";

export default function usePreRegister() {
  const [loading, setLoading] = useState(false);
  const [open, setModalOpen] = useState(false);

  const closeModal = () => setModalOpen(false);
  const openModal = () => setModalOpen(true);

  const onSubmit = (user) => {
    setLoading(true);
    api
      .post("usuario/pre-cadastro", {
        nome: user.nome,
        email: user.email,
        username: user.username,
        password: user.password,
        school: user.universidade,
        academic_title: user.academic_title,
        registration_id: user.registration_id,
        pronoun: Number(user.pronoun),
        status: "user",
      })
      .then(() => {
        toast.success(
          `O cadastro do usuário '${user.nome}' foi concluído com sucesso!`
        );
        window.location.reload();
      })
      .catch((error) => {
        const validationErrors = error.response.data?.data;
        if (validationErrors) {
          const keys = Object.keys(validationErrors);
          if (keys) {
            const KEY_MAP = {
              username: "nome de usuário",
              email: "e-mail",
            };

            const firstKey = keys[0];
            toast.error(
              `O ${KEY_MAP[firstKey]} '${user[firstKey]}' já está em uso. Escolha outro e tente novamente.`
            );
          }
        } else {
          toast.error(
            error.response?.data?.message ||
              "Ocorreu um erro ao tentar cadastrar o usuário."
          );
        }
      })
      .finally(() => setLoading(false));
  };

  return { open, loading, openModal, closeModal, onSubmit };
}
