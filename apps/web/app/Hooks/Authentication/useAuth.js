import { MyContext } from "Context";
import { useCallback, useContext, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 


export function useAuth() {
  const { loginUser, isLoggedIn } = useContext(MyContext);
  const [loading, setLoading] = useState(false);

  const history = useHistory();

  const signIn = useCallback(
    (user, ref) => {
      setLoading(true);
      loginUser(user)
        .then((response) => {
          if (response) {
            const {
              data: { id, token, refresh_token, role, name },
            } = response;

            localStorage.setItem("refresh_token", refresh_token);
            localStorage.setItem("token", token);
            localStorage.setItem("userId", id);
            localStorage.setItem("role", role);
            localStorage.setItem("nome", name);

            if (ref) window.location.href = ref;
            else {
              history.push("dashboard");
              window.location.reload();
            }
          } else toast.error("Usuário ou senha incorretos");
        })
        .finally(() => setLoading(false));
    },
    [loginUser, history]
  );

  const signOut = () => {
    // logoutUser();
  };

  return { loading, isLoggedIn, signIn, signOut };
}
