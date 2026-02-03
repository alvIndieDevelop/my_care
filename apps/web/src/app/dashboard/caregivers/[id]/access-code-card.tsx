'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/translations'

interface AccessCodeCardProps {
  caregiverId: string
  accessCode: string | null
}

export function AccessCodeCard({ caregiverId, accessCode }: AccessCodeCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentCode, setCurrentCode] = useState(accessCode)

  const generateNewCode = () => {
    // Generate a random 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleRegenerateCode = async () => {
    if (!confirm(t.guestAccess.regenerateConfirm)) {
      return
    }

    setLoading(true)
    try {
      const newCode = generateNewCode()
      
      const { error } = await supabase
        .from('caregivers')
        .update({ access_code: newCode })
        .eq('id', caregiverId)

      if (error) throw error

      setCurrentCode(newCode)
      router.refresh()
    } catch (err) {
      console.error('Error regenerating code:', err)
      alert(t.errors.failedToUpdate)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = async () => {
    setLoading(true)
    try {
      const newCode = generateNewCode()
      
      const { error } = await supabase
        .from('caregivers')
        .update({ access_code: newCode })
        .eq('id', caregiverId)

      if (error) throw error

      setCurrentCode(newCode)
      router.refresh()
    } catch (err) {
      console.error('Error generating code:', err)
      alert(t.errors.failedToUpdate)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (!currentCode) return
    
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying code:', err)
    }
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-lg text-amber-800 dark:text-amber-300 flex items-center gap-2">
          🔑 {t.guestAccess.accessCodeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {currentCode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-3xl font-mono font-bold tracking-widest text-foreground">
                {currentCode}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
              {t.guestAccess.accessCodeHelp}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="min-h-[44px] flex-1"
              >
                {copied ? t.guestAccess.codeCopied : t.guestAccess.copyCode}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateCode}
                disabled={loading}
                className="min-h-[44px] flex-1 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200"
              >
                {loading ? t.common.loading : t.guestAccess.regenerateCode}
              </Button>
            </div>
            <div className="pt-2">
              <a 
                href="/guest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver página de acceso →
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Este cuidador no tiene código de acceso. Genera uno para que pueda acceder a su horario.
            </p>
            <Button
              onClick={handleGenerateCode}
              disabled={loading}
              className="w-full min-h-[44px]"
            >
              {loading ? t.common.loading : '🔑 Generar Código de Acceso'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
