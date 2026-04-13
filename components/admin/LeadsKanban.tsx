'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import type { Lead } from '@/lib/supabase/types'
import { URGENCIA_LABELS, ESPECIALIDADE_LABELS } from '@/lib/utils'

interface Coluna {
  id: string
  label: string
}

interface Props {
  colunas: Coluna[]
  byStatus: Record<string, Lead[]>
}

const COLUNA_COLORS: Record<string, string> = {
  novo: '#b8965a',
  em_contato: '#3b82f6',
  agendado: '#10b981',
  proposta: '#8b5cf6',
  fechado: '#6b7280',
}

const URGENCIA_COLORS: Record<string, string> = {
  alta: '#ef4444',
  media: '#f59e0b',
  baixa: '#10b981',
}

export function LeadsKanban({ colunas, byStatus }: Props) {
  const [data, setData] = useState(byStatus)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const findColuna = useCallback(
    (leadId: string) => {
      return Object.keys(data).find((colId) => data[colId].some((l) => l.id === leadId))
    },
    [data]
  )

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveId(null)
      if (!over) return

      const leadId = active.id as string
      const targetColuna = over.id as string

      if (!colunas.find((c) => c.id === targetColuna)) return

      const sourceColuna = findColuna(leadId)
      if (!sourceColuna || sourceColuna === targetColuna) return

      const lead = data[sourceColuna].find((l) => l.id === leadId)
      if (!lead) return

      // Atualiza UI otimisticamente
      setData((prev) => ({
        ...prev,
        [sourceColuna]: prev[sourceColuna].filter((l) => l.id !== leadId),
        [targetColuna]: [{ ...lead, status: targetColuna as Lead['status'] }, ...prev[targetColuna]],
      }))

      // Persiste no banco
      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetColuna }),
        })
        if (!res.ok) throw new Error()
        toast.success(`Lead movido para "${colunas.find((c) => c.id === targetColuna)?.label}"`)
      } catch {
        // Reverte
        setData((prev) => ({
          ...prev,
          [targetColuna]: prev[targetColuna].filter((l) => l.id !== leadId),
          [sourceColuna]: [lead, ...prev[sourceColuna]],
        }))
        toast.error('Erro ao mover lead. Tente novamente.')
      }
    },
    [data, findColuna, colunas]
  )

  const activeCard = activeId
    ? Object.values(data).flat().find((l) => l.id === activeId)
    : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colunas.length}, minmax(240px, 1fr))`,
          gap: '1rem',
          overflow: 'auto',
          flex: 1,
          paddingBottom: '1rem',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
        }}
      >
        {colunas.map((col) => (
          <KanbanColumn key={col.id} coluna={col} leads={data[col.id] ?? []} color={COLUNA_COLORS[col.id]} />
        ))}
      </div>

      <DragOverlay>
        {activeCard && <LeadCard lead={activeCard} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({ coluna, leads, color }: { coluna: Coluna; leads: Lead[]; color: string }) {
  return (
    <div
      id={coluna.id}
      style={{
        background: '#f5f4f2',
        borderRadius: '4px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header da coluna */}
      <div
        style={{
          padding: '.75rem 1rem',
          borderBottom: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '.78rem', fontWeight: 500, color: '#0f0e0c' }}>{coluna.label}</span>
        <span
          style={{
            fontSize: '.68rem',
            background: `${color}22`,
            color,
            padding: '.15rem .5rem',
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Área de drop */}
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div
          style={{ padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem', flex: 1 }}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function LeadCard({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        background: '#fff',
        border: '1px solid #e5e5e3',
        borderRadius: '3px',
        padding: '.75rem',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,.12)' : 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem' }}>
        <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c' }}>{lead.nome}</div>
        {lead.urgencia && (
          <span
            style={{
              fontSize: '.6rem',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: URGENCIA_COLORS[lead.urgencia],
              background: `${URGENCIA_COLORS[lead.urgencia]}18`,
              padding: '.15rem .4rem',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          >
            {URGENCIA_LABELS[lead.urgencia]}
          </span>
        )}
      </div>

      {lead.especialidade && (
        <div style={{ fontSize: '.72rem', color: '#7a7570', marginTop: '.25rem' }}>
          {ESPECIALIDADE_LABELS[lead.especialidade] ?? lead.especialidade}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.5rem' }}>
        <span style={{ fontSize: '.68rem', color: '#7a7570' }}>
          {lead.origem ?? 'site'}
        </span>
        {lead.ticket_estimado && (
          <span
            style={{
              fontSize: '.68rem',
              color: '#b8965a',
              background: '#b8965a12',
              padding: '.1rem .4rem',
              borderRadius: '2px',
            }}
          >
            R$ {lead.ticket_estimado.toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      <a
        href={`/admin/leads/${lead.id}`}
        style={{
          display: 'block',
          marginTop: '.75rem',
          fontSize: '.7rem',
          color: '#b8965a',
          textDecoration: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        Ver perfil →
      </a>
    </div>
  )
}
