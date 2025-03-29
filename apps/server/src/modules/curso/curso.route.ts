import { Hono } from "hono"
import { TODO } from "../todo"

export const cursoRoutes = new Hono()

// GET /cursos (Listar cursos) - Original: actionGetCursos
cursoRoutes.get("/", (c) => TODO({ c, path: "/cursos", method: "GET" }))

// POST /cursos (Criar curso) - Original: actionCreateCurso
cursoRoutes.post("/", (c) => TODO({ c, path: "/cursos", method: "POST" }))

// PUT /cursos/:id (Editar curso) - Original: actionEditCursos
cursoRoutes.put("/:id", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/cursos/:id", method: "PUT", params: { id } })
})

// DELETE /cursos/:id (Deletar curso) - Original: actionDeleteCurso
cursoRoutes.delete("/:id", (c) => {
  const id = c.req.param("id")
  return TODO({ c, path: "/cursos/:id", method: "DELETE", params: { id } })
})
