'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { addSelfAsCaregiver } from '@/app/actions/caregiver-actions'
import { UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddSelfAsCaregiver() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  async function handleAddSelf() {
    if (!confirm('¿Quieres agregarte como cuidador? Podrás ver tus propios turnos y tareas.')) {
      return
    }
    
    setLoading(true)
    try {
      const result = await addSelfAsCaregiver()
      
      if (result.success) {
        toast.success('Te has agregado como cuidador correctamente')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al agregarte como cuidador')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregarte como cuidador')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <UserPlus className="h-5 w-5" />
          ¿Quieres ser cuidador también?
        </CardTitle>
        <CardDescription className="text-sm">
          Como administrador, puedes agregarte como cuidador para ver tus propios turnos, 
          completar tareas y registrar medicamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleAddSelf} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Agregando...' : 'Agregarme como cuidador'}
        </Button>
      </CardContent>
    </Card>
  )
}
