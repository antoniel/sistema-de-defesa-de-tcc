import { useEffect, useMemo, useState } from "react";
import api from "Config/http";

export default function useCourses() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState("");

  const refreshCourses = () =>
    api.get("cursos").then(({ data: { data } }) => setCourses(data));

  const memoizedCourses = useMemo(() => {
    if (query) {
      return courses.filter(
        (course) =>
          course.nome && course.nome.toLowerCase().includes(query.toLowerCase())
      );
    }
    return courses;
  }, [courses, query]);

  useEffect(() => {
    setLoading(true);
    refreshCourses().finally(() => setLoading(false));
  }, []);

  const handleSearch = (query) => setQuery(query);
  const handleCreate = (course) => {
    setLoading(true);
    api
      .post(`/cursos`, course)
      .then(refreshCourses)
      .finally(() => setLoading(false));
  };
  const handleEdit = (course) => {
    const { id } = course;
    setLoading(true);
    api
      .put(`/cursos/${id}`, course)
      .then(refreshCourses)
      .finally(() => setLoading(false));
  };
  const handleDelete = (course) => {
    const { id } = course;
    setLoading(true);
    api
      .delete(`/cursos/${id}`, course)
      .then(refreshCourses)
      .finally(() => setLoading(false));
  };

  return {
    loading,
    courses: memoizedCourses,
    handleSearch,
    handleCreate,
    handleEdit,
    handleDelete,
  };
}
