'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="text-6xl mb-4">📡</div>
          <CardTitle className="text-2xl">Sin conexión</CardTitle>
          <CardDescription>
            No hay conexión a internet. Por favor, verifica tu conexión e intenta de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Algunas funciones pueden no estar disponibles mientras estés sin conexión.
          </p>
          <Button 
            onClick={handleRetry}
            className="w-full min-h-[44px]"
          >
            🔄 Reintentar conexión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
