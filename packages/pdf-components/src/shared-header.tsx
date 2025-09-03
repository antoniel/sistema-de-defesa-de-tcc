import { Text, View } from "@react-pdf/renderer"
import React from "react"
import { sharedStyles } from "./shared-styles"
;(React as any).a = 1 as any

interface SharedDocumentHeaderProps {
  curso: { nome: string }
}

export function SharedDocumentHeader({ curso }: SharedDocumentHeaderProps) {
  return (
    <View style={sharedStyles.header}>
      <Text style={sharedStyles.headerLine}>Universidade Federal da Bahia</Text>
      <Text style={sharedStyles.headerLine}>Departamento de Ciência da Computação</Text>
      <Text style={sharedStyles.headerLine}>Bacharelado em Sistemas de Informação</Text>
      <Text style={sharedStyles.headerSubline}>Campus Universitário de Ondina</Text>
      <Text style={sharedStyles.cep}>CEP: 40170-115 - Salvador - BA</Text>
    </View>
  )
}
