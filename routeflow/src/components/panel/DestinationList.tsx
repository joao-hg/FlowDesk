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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Destination, Location } from "@/types";

interface DestinationListProps {
  destinations: Destination[];
  onQueryChange: (id: string, value: string) => void;
  onSelect: (id: string, location: Location) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

interface RowProps {
  destination: Destination;
  index: number;
  canRemove: boolean;
  onQueryChange: (id: string, value: string) => void;
  onSelect: (id: string, location: Location) => void;
  onRemove: (id: string) => void;
}

function DestinationRow({
  destination,
  index,
  canRemove,
  onQueryChange,
  onSelect,
  onRemove,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: destination.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-start gap-2 rounded-xl",
        isDragging && "z-10 bg-surface shadow-lg ring-1 ring-brand/30",
      )}
    >
      <button
        type="button"
        aria-label={`Reordenar destino ${index + 1}`}
        className="mt-1 flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/70 transition hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>

      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
          destination.status === "resolved"
            ? "bg-brand text-brand-foreground"
            : "bg-surface-muted text-muted-foreground",
        )}
      >
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <AddressAutocomplete
          ariaLabel={`Endereço do destino ${index + 1}`}
          value={destination.query}
          placeholder="Rua, número, cidade"
          resolved={destination.status === "resolved"}
          errorMessage={destination.errorMessage}
          onChange={(value) => onQueryChange(destination.id, value)}
          onSelect={(location) => onSelect(destination.id, location)}
          onClear={() => onQueryChange(destination.id, "")}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-danger"
        aria-label={`Remover destino ${index + 1}`}
        onClick={() => onRemove(destination.id)}
        disabled={!canRemove}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </li>
  );
}

export function DestinationList({
  destinations,
  onQueryChange,
  onSelect,
  onRemove,
  onAdd,
  onReorder,
}: DestinationListProps) {
  const sensors = useSensors(
    // A distância mínima evita que um clique no campo vire arrasto.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = destinations.findIndex((destination) => destination.id === active.id);
    const to = destinations.findIndex((destination) => destination.id === over.id);
    if (from !== -1 && to !== -1) onReorder(from, to);
  };

  return (
    <section aria-labelledby="destinations-heading" className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2
          id="destinations-heading"
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          Destinos
        </h2>
        <span className="text-[0.6875rem] text-muted-foreground">
          {destinations.filter((destination) => destination.coordinate).length} de{" "}
          {destinations.length} confirmados
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={destinations.map((destination) => destination.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {destinations.map((destination, index) => (
              <DestinationRow
                key={destination.id}
                destination={destination}
                index={index}
                canRemove={destinations.length > 1}
                onQueryChange={onQueryChange}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="subtle" size="sm" className="w-full" onClick={onAdd}>
        <Plus className="h-4 w-4" aria-hidden />
        Adicionar destino
      </Button>
    </section>
  );
}
