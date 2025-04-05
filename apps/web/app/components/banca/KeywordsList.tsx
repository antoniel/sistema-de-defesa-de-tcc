import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface KeywordsListProps {
  keywords: string
  className?: string
  badgeClassName?: string
  label?: string
  showLabel?: boolean
}

export function KeywordsList({
  keywords,
  className,
  badgeClassName,
  label = "Palavras-chave",
  showLabel = true,
}: KeywordsListProps) {
  // Split the keywords string by commas and trim whitespace
  const keywordArray = keywords
    ? keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    : []

  if (keywordArray.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && <p className="text-sm text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {keywordArray.map((keyword, index) => (
          <Badge key={index} variant="secondary" className={cn("text-xs font-normal", badgeClassName)}>
            {keyword}
          </Badge>
        ))}
      </div>
    </div>
  )
}
