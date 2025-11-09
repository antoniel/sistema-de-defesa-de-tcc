import { FeatureRequests } from "@/components/feedback/FeatureRequests"
import { FeedbackForm } from "@/components/feedback/FeedbackForm"
import { FeedbackStatistics } from "@/components/feedback/FeedbackStatistics"
import { Header } from "@/components/layout/Header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/services/useUser"
import { Loader2 } from "lucide-react"
import { Navigate } from "react-router"
import type { Route } from "./+types/feedback"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Feedback" }]

export default function FeedbackPage() {
  const { data: user, isLoading: userLoading } = useUser()

  if (userLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" />
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form">Enviar Feedback</TabsTrigger>
            <TabsTrigger value="statistics">Resultados da Pesquisa</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <FeedbackForm />
          </TabsContent>

          <TabsContent value="statistics">
            <FeedbackStatistics />
          </TabsContent>

          <TabsContent value="requests">
            <FeatureRequests />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
