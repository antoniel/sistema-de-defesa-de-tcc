import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFeedbackStatisticsQuery } from "@/services/feedbackService"
import type { FeedbackStatistics } from "@tcc/server/src/modules/feedback/feedback.service"
import { Loader2 } from "lucide-react"

export function FeedbackStatistics() {
  const { data: statistics, isLoading: statsLoading } = useFeedbackStatisticsQuery()

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!statistics || statistics.totalSubmissions < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados do Feedback</CardTitle>
          <CardDescription>Estatísticas e análises dos feedbacks recebidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-semibold text-muted-foreground">Dados insuficientes</p>
            <p className="text-sm text-muted-foreground mt-2">
              São necessários pelo menos 3 feedbacks para exibir as estatísticas.
            </p>
            {statistics && (
              <p className="text-sm text-muted-foreground mt-1">Feedbacks recebidos: {statistics.totalSubmissions}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resultados do Feedback</CardTitle>
          <CardDescription>Estatísticas e análises dos feedbacks recebidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewSection statistics={statistics} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações Médias</CardTitle>
        </CardHeader>
        <CardContent>
          <RatingsSection statistics={statistics} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uso do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemUsageSection statistics={statistics} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil dos Respondentes</CardTitle>
        </CardHeader>
        <CardContent>
          <AcademicProfileSection statistics={statistics} />
        </CardContent>
      </Card>
    </div>
  )
}

interface StatisticsProps {
  statistics: FeedbackStatistics
}

function OverviewSection({ statistics }: StatisticsProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Total de Feedbacks</span>
        <span className="text-2xl font-bold">{statistics.totalSubmissions}</span>
      </div>
    </div>
  )
}

function RatingsSection({ statistics }: StatisticsProps) {
  const ratings = [
    {
      label: "Complexidade das Tarefas",
      value: statistics.averageTaskComplexity,
      description: "1 = Baixa, 5 = Alta",
    },
    {
      label: "Consistência da Interface",
      value: statistics.averageInterfaceConsistency,
      description: "1 = Baixa, 5 = Alta",
    },
    {
      label: "Tempo de Resposta",
      value: statistics.averageResponseTime,
      description: "1 = Muito lento, 5 = Muito rápido",
    },
    {
      label: "Satisfação Geral",
      value: statistics.averageSatisfaction,
      description: "1 = Muito insatisfeito, 5 = Muito satisfeito",
    },
  ]

  return (
    <div className="space-y-6">
      {ratings.map((rating) => (
        <RatingBar key={rating.label} label={rating.label} value={rating.value} description={rating.description} />
      ))}
    </div>
  )
}

interface RatingBarProps {
  label: string
  value: number
  description: string
}

function RatingBar({ label, value, description }: RatingBarProps) {
  const percentage = (value / 5) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="text-lg font-semibold">{value.toFixed(2)}</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function SystemUsageSection({ statistics }: StatisticsProps) {
  const completedPercentage = (statistics.completedAllTasksCount / statistics.totalSubmissions) * 100
  const notCompletedPercentage = 100 - completedPercentage

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-3">Completou todas as tarefas?</h4>
        <div className="space-y-2">
          <PercentageBar label="Sim" count={statistics.completedAllTasksCount} percentage={completedPercentage} />
          <PercentageBar
            label="Não"
            count={statistics.totalSubmissions - statistics.completedAllTasksCount}
            percentage={notCompletedPercentage}
          />
        </div>
      </div>
    </div>
  )
}

interface PercentageBarProps {
  label: string
  count: number
  percentage: number
}

function PercentageBar({ label, count, percentage }: PercentageBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function AcademicProfileSection({ statistics }: StatisticsProps) {
  const studentPercentage = (statistics.studentSubmissions / statistics.totalSubmissions) * 100
  const teacherPercentage = (statistics.teacherSubmissions / statistics.totalSubmissions) * 100
  console.log(statistics, studentPercentage, teacherPercentage)

  return (
    <div className="space-y-2">
      <PercentageBar label="Estudantes" count={statistics.studentSubmissions} percentage={studentPercentage} />
      <PercentageBar label="Professores" count={statistics.teacherSubmissions} percentage={teacherPercentage} />
    </div>
  )
}
