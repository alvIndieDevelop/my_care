'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Tables } from '@/types/database'
import { t } from '@/lib/translations'

interface TaskListProps {
  scheduleId: string
  tasks: Tables<'tasks'>[]
}

export function TaskList({ scheduleId, tasks }: TaskListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueTime, setDueTime] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueTime('')
    setShowForm(false)
    setEditingTask(null)
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          schedule_id: scheduleId,
          title: title.trim(),
          description: description.trim() || null,
          due_time: dueTime || null,
          sort_order: tasks.length,
        })

      if (error) throw error
      resetForm()
      router.refresh()
    } catch (err) {
      console.error('Error adding task:', err)
      alert(t.errors.failedToCreate)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(t.tasks.deleteConfirm)) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error deleting task:', err)
      alert(t.errors.failedToDelete)
    }
  }

  const startEditing = (task: Tables<'tasks'>) => {
    setEditingTask(task.id)
    setTitle(task.title)
    setDescription(task.description || '')
    setDueTime(task.due_time || '')
  }

  const handleUpdateTask = async (taskId: string) => {
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          due_time: dueTime || null,
        })
        .eq('id', taskId)

      if (error) throw error
      resetForm()
      router.refresh()
    } catch (err) {
      console.error('Error updating task:', err)
      alert(t.errors.failedToUpdate)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Task List */}
      {tasks.length > 0 ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              {editingTask === task.id ? (
                <div className="p-4 rounded-lg border border-border bg-blue-50 dark:bg-blue-900/20 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="editTitle">{t.tasks.taskTitle} *</Label>
                    <Input
                      id="editTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t.tasks.placeholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">{t.tasks.description}</Label>
                    <Textarea
                      id="editDescription"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t.tasks.descriptionPlaceholder}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDueTime">{t.tasks.dueTime} ({t.common.optional})</Label>
                    <Input
                      id="editDueTime"
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateTask(task.id)}
                      disabled={loading}
                    >
                      {t.common.save}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={resetForm}
                    >
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    {task.due_time && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {t.tasks.dueTime}: {task.due_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => startEditing(task)}
                    >
                      ✏️
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-muted-foreground py-4">
          {t.tasks.noTasksYet}
        </p>
      )}

      {/* Add Task Form */}
      {showForm ? (
        <form onSubmit={handleAddTask} className="p-4 rounded-lg border border-border bg-muted space-y-3">
          <div className="space-y-2">
            <Label htmlFor="title">{t.tasks.taskTitle} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.tasks.placeholder}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t.tasks.description}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.tasks.descriptionPlaceholder}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueTime">{t.tasks.dueTime} ({t.common.optional})</Label>
            <Input
              id="dueTime"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t.tasks.dueTimeHelp}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? t.tasks.adding : t.tasks.addTask}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          {t.tasks.addTask}
        </Button>
      )}
    </div>
  )
}
