export const createDatabaseCleanup = (db: any, tables: any) => {
  return async () => {
    if (tables.usuariosBancas) await db.delete(tables.usuariosBancas)
    if (tables.Bancas) await db.delete(tables.Bancas)
    if (tables.Users) await db.delete(tables.Users)
    if (tables.Cursos) await db.delete(tables.Cursos)
  }
}

export const createSelectiveCleanup = (db: any) => {
  return async (tableNames: string[]) => {
    for (const tableName of tableNames) {
      try {
        await db.delete(db[tableName])
      } catch (error) {
        console.warn(`Could not clean table ${tableName}:`, error)
      }
    }
  }
}