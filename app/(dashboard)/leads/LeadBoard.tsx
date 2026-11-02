"use client";

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { MessageCircle, Phone, Mail } from "lucide-react";
import type { Lead } from "@/types";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, isLeadStatus, type LeadStatus } from "@/lib/lead-status";
import { whatsappDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  leads: Lead[];
  onMove: (id: string, status: LeadStatus) => void;
}

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.round(h / 24);
  return d < 30 ? `قبل ${d} يوم` : new Date(iso).toLocaleDateString("ar-u-nu-latn");
}

/** Kanban view of leads: drag a card between columns to change its status. */
export function LeadBoard({ leads, onMove }: Props) {
  const statusOf = (l: Lead): LeadStatus => (isLeadStatus(l.status) ? l.status : "new");
  const columns = LEAD_STATUSES.map((s) => ({ s, items: leads.filter((l) => statusOf(l) === s) }));

  function onDragEnd(r: DropResult) {
    if (!r.destination || r.destination.droppableId === r.source.droppableId) return;
    const to = r.destination.droppableId;
    if (isLeadStatus(to)) onMove(r.draggableId, to);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {columns.map(({ s, items }) => (
          <Droppable droppableId={s} key={s}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex w-[78vw] max-w-[260px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-muted/30 p-2 transition-colors sm:w-[240px]",
                  snapshot.isDraggingOver && "border-primary/50 bg-primary/5",
                )}
              >
                <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", LEAD_STATUS_COLORS[s])}>{LEAD_STATUS_LABELS[s]}</span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex min-h-[120px] flex-col gap-2">
                  {items.map((l, i) => {
                    const wa = whatsappDigits(l.phone);
                    return (
                      <Draggable draggableId={l.id} index={i} key={l.id}>
                        {(p, snap) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className={cn(
                              "rounded-xl border border-border bg-card p-3 text-sm shadow-sm transition-shadow",
                              snap.isDragging && "rotate-1 shadow-xl ring-2 ring-primary/40",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold leading-tight">{l.name}</p>
                              <span className="shrink-0 text-[10px] text-muted-foreground">{ago(l.createdAt)}</span>
                            </div>
                            {l.phone && <bdi dir="ltr" className="mt-1 block text-xs text-muted-foreground">{l.phone}</bdi>}
                            {l.note && <p className="mt-1.5 line-clamp-2 rounded-md bg-muted/60 px-2 py-1 text-xs">{l.note}</p>}
                            <div className="mt-2 flex gap-1">
                              {wa && (
                                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="واتساب"
                                  className="rounded-md p-1.5 text-[#1a9e4b] hover:bg-[#25D366]/10"><MessageCircle className="h-3.5 w-3.5" /></a>
                              )}
                              {l.phone && (
                                <a href={`tel:${l.phone}`} aria-label="اتصال" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Phone className="h-3.5 w-3.5" /></a>
                              )}
                              {l.email && (
                                <a href={`mailto:${l.email}`} aria-label="بريد" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Mail className="h-3.5 w-3.5" /></a>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  {items.length === 0 && !snapshot.isDraggingOver && (
                    <p className="py-6 text-center text-xs text-muted-foreground/70">اسحب بطاقة إلى هنا</p>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
