'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Eye, Timer } from 'lucide-react'

export default function CampayoTraining() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Campo Visual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Expande tu campo visual periférico para leer múltiples palabras simultáneamente.
          </p>
          <Button className="w-full">Comenzar Ejercicio</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Subvocalización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Reduce la voz interna para aumentar la velocidad de procesamiento.
          </p>
          <Button className="w-full">Comenzar Ejercicio</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Flash Words
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Reconoce palabras en fracciones de segundo.
          </p>
          <Button className="w-full">Comenzar Ejercicio</Button>
        </CardContent>
      </Card>
    </div>
  )
}