'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { t } from '@/lib/translations'

interface MedicationDetailModalProps {
  medication: {
    name: string
    dosage: string
    instructions: string | null
    careRecipientName: string
  }
  children: React.ReactNode
}

export function MedicationDetailModal({ medication, children }: MedicationDetailModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            💊 {medication.name}
          </DialogTitle>
          <DialogDescription>
            {medication.careRecipientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t.medications.dosage}</p>
            <p className="text-lg text-foreground">{medication.dosage}</p>
          </div>
          
          {medication.instructions && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t.medications.instructions}</p>
              <p className="text-foreground whitespace-pre-wrap">{medication.instructions}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
