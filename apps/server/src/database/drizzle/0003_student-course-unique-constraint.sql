WITH registros_ranqueados AS (
    SELECT 
        id,
        aluno_id,
        curso_id,
        ROW_NUMBER() OVER (
            PARTITION BY aluno_id, curso_id 
            ORDER BY 
                visible DESC,  -- Prioridade para visible = true
                data_realizacao DESC,  -- Depois por data mais recente
                id DESC  -- Por último, por ID mais alto
        ) as rn
    FROM banca
),
ids_para_deletar AS (
    SELECT id
    FROM registros_ranqueados
    WHERE rn > 1  -- Todos exceto o primeiro (que será mantido)
),
-- Deletar primeiro as referências em usuario_banca
delete_usuario_banca AS (
    DELETE FROM usuario_banca 
    WHERE id_banca IN (SELECT id FROM ids_para_deletar)
    RETURNING id_banca
)
-- Depois deletar as bancas
DELETE FROM banca 
WHERE id IN (SELECT id FROM ids_para_deletar);--> statement-breakpoint
ALTER TABLE "banca" ADD CONSTRAINT "aluno_curso_unique" UNIQUE("aluno_id","curso_id");