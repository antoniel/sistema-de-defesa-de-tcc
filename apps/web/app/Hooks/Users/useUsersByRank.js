import api from "Config/http";
import { useEffect, useState } from "react";

export default function useUsersByRank(rank) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/usuario", { params: { role: rank } })
      .then(({ data: { data: users } }) => setUsers(users))
      .finally(() => setLoading(false));
  }, [rank]);

  return { loading, users };
}
