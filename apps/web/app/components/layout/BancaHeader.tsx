import type { ReactNode } from "react"

interface BancaHeaderProps {
  title: string
  trabalho: string
  autor: string
  curso: string
  additionalActions?: ReactNode
}

export function BancaHeader({ title, trabalho, autor, curso, additionalActions }: BancaHeaderProps) {
  return (
    <div className="bg-muted p-6 border-b">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <img src="/brasao_ufba.png" alt="Brasão da UFBA" className="w-16 h-16 object-contain" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-2">{trabalho}</p>
            <p className="text-sm text-muted-foreground">
              Autor: {autor} • Curso: {curso}
            </p>
          </div>
        </div>

        {additionalActions && additionalActions}
      </div>
    </div>
  )
}