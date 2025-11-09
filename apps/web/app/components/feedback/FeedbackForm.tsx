import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useSubmitFeedbackMutation } from "@/services/feedbackService"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { z } from "zod"

const feedbackFormSchema = z.object({
  taskComplexityRating: z.number().int().min(1).max(5),
  interfaceConsistencyRating: z.number().int().min(1).max(5),
  responseTimeRating: z.number().int().min(1).max(5),
  satisfactionRating: z.number().int().min(1).max(5),
  usagePurposes: z.array(z.string()).min(1, { message: "Selecione ao menos uma finalidade." }),
  usagePurposeOther: z.string().optional(),
  completedAllTasks: z.boolean(),
})

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>

const USAGE_PURPOSE_OPTIONS = [
  { id: "schedule", label: "Agendar defesas" },
  { id: "view", label: "Ver apresentações futuras" },
  { id: "search", label: "Pesquisar trabalhos anteriores" },
  { id: "wouldnt", label: "Não usaria" },
  { id: "other", label: "Outro" },
]

export function FeedbackForm() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const submitFeedbackMutation = useSubmitFeedbackMutation()

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      taskComplexityRating: 3,
      interfaceConsistencyRating: 3,
      responseTimeRating: 3,
      satisfactionRating: 3,
      usagePurposes: [],
      usagePurposeOther: "",
      completedAllTasks: undefined,
    },
  })

  function onSubmit(data: FeedbackFormValues) {
    submitFeedbackMutation.mutate(
      { json: data },
      {
        onSuccess: () => {
          toast({
            title: "Feedback enviado com sucesso",
            description: "Obrigado por contribuir com sua opinião!",
          })
          form.reset()
          navigate("/")
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao enviar seu feedback."

          if (errorMessage.includes("400") || errorMessage.toLowerCase().includes("já enviou")) {
            toast({
              title: "Feedback já enviado",
              description: "Você já enviou seu feedback",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Erro ao enviar feedback",
              description: errorMessage,
              variant: "destructive",
            })
          }
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback do Sistema</CardTitle>
        <CardDescription>
          Sua opinião é muito importante para melhorar o sistema. Por favor, responda as perguntas abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <RatingScalesSection form={form} />
            <SystemUsageSection form={form} />
            <TaskCompletionSection form={form} />

            <Button type="submit" className="w-full" disabled={submitFeedbackMutation.isPending}>
              {submitFeedbackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Feedback"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

interface FormSectionProps {
  form: ReturnType<typeof useForm<FeedbackFormValues>>
}

function RatingScalesSection({ form }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Avaliação do Sistema</h3>

      <RatingScale
        form={form}
        name="taskComplexityRating"
        label="Complexidade das Tarefas"
        minLabel="Baixa"
        maxLabel="Alta"
      />

      <RatingScale
        form={form}
        name="interfaceConsistencyRating"
        label="Consistência da Interface"
        minLabel="Baixa"
        maxLabel="Alta"
      />

      <RatingScale
        form={form}
        name="responseTimeRating"
        label="Tempo de Resposta"
        minLabel="Muito lento"
        maxLabel="Muito rápido"
      />

      <RatingScale
        form={form}
        name="satisfactionRating"
        label="Satisfação Geral"
        minLabel="Muito insatisfeito"
        maxLabel="Muito satisfeito"
      />
    </div>
  )
}

interface RatingScaleProps {
  form: ReturnType<typeof useForm<FeedbackFormValues>>
  name: keyof FeedbackFormValues
  label: string
  minLabel: string
  maxLabel: string
}

function RatingScale({ form, name, label, minLabel, maxLabel }: RatingScaleProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={`flex-1 h-12 rounded-md border-2 transition-colors ${
                      field.value === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:border-primary hover:bg-accent"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function SystemUsageSection({ form }: FormSectionProps) {
  const selectedPurposes = form.watch("usagePurposes")
  const showOtherInput = selectedPurposes.includes("other")

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Uso do Sistema</h3>

      <FormField
        control={form.control}
        name="usagePurposes"
        render={() => (
          <FormItem>
            <FormLabel>Para quais finalidades você usaria?</FormLabel>
            <div className="space-y-2">
              {USAGE_PURPOSE_OPTIONS.map((option) => (
                <FormField
                  key={option.id}
                  control={form.control}
                  name="usagePurposes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            const value = field.value || []
                            if (checked) {
                              field.onChange([...value, option.id])
                            } else {
                              field.onChange(value.filter((v) => v !== option.id))
                            }
                          }}
                        />
                      </FormControl>
                      <Label className="font-normal cursor-pointer">{option.label}</Label>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {showOtherInput && (
        <FormField
          control={form.control}
          name="usagePurposeOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especifique outras finalidades</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva outras finalidades..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}

function TaskCompletionSection({ form }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Conclusão das Tarefas</h3>

      <FormField
        control={form.control}
        name="completedAllTasks"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Você conseguiu completar todas as tarefas propostas?</FormLabel>
            <FormControl>
              <RadioGroup onValueChange={(value) => field.onChange(value === "true")} value={String(field.value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="completed-yes" />
                  <Label htmlFor="completed-yes" className="font-normal cursor-pointer">
                    Sim
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="completed-no" />
                  <Label htmlFor="completed-no" className="font-normal cursor-pointer">
                    Não
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
