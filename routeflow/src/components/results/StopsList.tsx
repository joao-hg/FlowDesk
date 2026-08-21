"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, GripVertical, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Destination, Origin, Route } from "@/types";
import { formatDistance, formatDuration, padOrder } from "@/utils/format";

interface StopsListProps {
  origin: Origin;
  stops: Destination[];
  route: Route;
  isStale: boolean;
  isCalculating: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRevalidate: () => void;
}

interface StopRowProps {
  id: string;
  position: number;
  title: string;
  subtitle?: string;
  legDistance?: number;
  legDuration?: number;
  isOrigin?: boolean;
  isLast?: boolean;
  draggable?: boolean;
}

function StopRow({
  id,
  position,
  title,
  subtitle,
  legDistance,
  legDuration,
  isOrigin,
  isLast,
  draggable = true,
}: StopRowProps) {
  const sortable = useSortable({ id, disabled: !draggable });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative rounded-xl", isDragging && "z-10 bg-surface shadow-lg ring-1 ring-brand/30")}
    >
      <div className="flex items-start gap-3 rounded-xl px-1 py-2">
        <span
          aria-hidden
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
            isOrigin ? "bg-success text-white" : "bg-brand text-brand-foreground",
          )}
        >
          {isOrigin ? "●" : position - 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {padOrder(position)} — {isOrigin ? "Origem" : `Parada ${position - 1}`}
          </p>
          <p className="truncate text-sm font-medium text-foreground" title={title}>
            {title}
          </p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {draggable ? (
          <button
            type="button"
            aria-label={`Reordenar parada ${position - 1}`}
            className="mt-1 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/70 transition hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {!isLast ? (
        <div className="flex items-center gap-2 pb-1 pl-4 text-[0.6875rem] text-muted-foreground">
          <ArrowDown className="h-3.5 w-3.5 text-brand/60" aria-hidden />
          {legDistance !== undefined && legDuration !== undefined ? (
            <span className="tabular-nums">
              {formatDistance(legDistance)} — {formatDuration(legDuration)}
            </span>
          ) : (
            <span>trecho não calculado</span>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function StopsList({
  origin,
  stops,
  route,
  isStale,
  isCalculating,
  onReorder,
  onRevalidate,
}: StopsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = stops.findIndex((stop) => stop.id === active.id);
    const to = stops.findIndex((stop) => stop.id === over.id);
    if (from !== -1 && to !== -1) onReorder(from, to);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de paradas</CardTitle>
        <CardDescription>
          Arraste para reordenar manualmente e revalide para recalcular distâncias e tempos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <ul className="space-y-0.5">
            <StopRow
              id="__origin__"
              position={1}
              title={origin.address?.label ?? origin.query}
              subtitle="Ponto de partida"
              legDistance={route.legs[0]?.distanceMeters}
              legDuration={route.legs[0]?.durationSeconds}
              isOrigin
              draggable={false}
            />
            <SortableContext
              items={stops.map((stop) => stop.id)}
              strategy={verticalListSortingStrategy}
            >
              {stops.map((stop, index) => (
                <StopRow
                  key={stop.id}
                  id={stop.id}
                  position={index + 2}
                  title={stop.address?.label ?? stop.query}
                  legDistance={route.legs[index + 1]?.distanceMeters}
                  legDuration={route.legs[index + 1]?.durationSeconds}
                  isLast={index === stops.length - 1}
                />
              ))}
            </SortableContext>
          </ul>
        </DndContext>

        {isStale ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onRevalidate}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Revalidar rota
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
