interface ReviewFieldProps {
  label: string
  value: string | undefined
  className?: string
}

export function ReviewField({ label, value, className = "" }: ReviewFieldProps) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "Não informado"}</p>
    </div>
  )
}