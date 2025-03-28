import { useState } from "react";

export default function useSearchBar() {
  const [query, setQuery] = useState("");
  const handleSearch = (query) => setQuery(query);

  return { query, handleSearch };
}
