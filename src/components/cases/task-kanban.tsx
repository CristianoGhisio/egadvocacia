'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Task = {
  id: string
  tenantId: string
  matterId: string | null
  assignedToId: string | null
  title: string
  description: string | null
  dueDate: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

interface TaskKanbanProps {
  caseId: string
}

export function TaskKanban({ caseId }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [dueDate, setDueDate] = useState<string>('')

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (e) {
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = async () => {
    if (!title.trim()) return
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, dueDate: dueDate || undefined })
      })
      if (res.ok) {
        setTitle('')
        setPriority('medium')
        setDueDate('')
        fetchTasks()
      }
    } catch (e) {
    }
  }

  const moveTask = async (taskId: string, status: Task['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchTasks()
    } catch (e) {
    }
  }

  const lanes: { key: Task['status']; title: string }[] = [
    { key: 'pending', title: 'A Fazer' },
    { key: 'in_progress', title: 'Em Andamento' },
    { key: 'completed', title: 'Concluídas' },
    { key: 'cancelled', title: 'Canceladas' },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova Tarefa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button onClick={createTask}>Criar</Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div>Carregando tarefas...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {lanes.map((lane) => (
            <Card key={lane.key}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{lane.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.filter(t => t.status === lane.key).map((t) => (
                  <div key={t.id} className="border rounded p-2">
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.priority === 'urgent' ? 'Urgente' : t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {lane.key !== 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => moveTask(t.id, 'pending')}>A Fazer</Button>
                      )}
                      {lane.key !== 'in_progress' && (
                        <Button variant="outline" size="sm" onClick={() => moveTask(t.id, 'in_progress')}>Em Andamento</Button>
                      )}
                      {lane.key !== 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => moveTask(t.id, 'completed')}>Concluir</Button>
                      )}
                      {lane.key !== 'cancelled' && (
                        <Button variant="outline" size="sm" onClick={() => moveTask(t.id, 'cancelled')}>Cancelar</Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
