import { formatDistance, formatMinutes } from "@/lib/format";
import { walkingMinutes } from "./totals";
import type { RouteStop } from "@/api/types";
import { AddPlaces } from "./AddPlaces";
import { RouteStopList } from "./StopList";
import type { EditableRoute } from "./useEditableRoute";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  route: EditableRoute;
  recalculating: boolean;
  error: string;
  availableMinutes: number;
  compact: boolean;
  onSelect: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onAdd: (stop: RouteStop, index?: number) => void;
  onSwap: (removeIds: string[], stop?: RouteStop, index?: number) => void;
  onExtendTime: (minutes: number) => void;
  onAccept: () => void;
};

export function RoutePanel({
  route,
  recalculating,
  error,
  availableMinutes,
  compact,
  onSelect,
  onMove,
  onRemove,
  onAdd,
  onSwap,
  onExtendTime,
  onAccept,
}: Props) {
  const totalMinutes = walkingMinutes(route.path);
  const overBy = totalMinutes - availableMinutes;

  return (
    <section
      aria-labelledby="route-h"
      className="flex min-h-full flex-col justify-between gap-4 max-lg:min-h-0 max-lg:flex-1 lg:gap-6"
    >
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="route-h" className="font-heading text-xl font-bold">
            {compact ? "Twoja trasa" : "Proponowana trasa"}
          </h2>
        </div>

        {!compact && (
          <AddPlaces
            route={route}
            availableMinutes={availableMinutes}
            totalMinutes={totalMinutes}
            onAdd={onAdd}
            onSwap={onSwap}
            onExtendTime={onExtendTime}
          />
        )}
      </div>

      {route.stops.length === 0 ? (
        <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
          Trasa nie ma jeszcze miejsc. Dodaj je powyżej.
        </p>
      ) : (
        <div className="max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto">
          <RouteStopList
            stops={route.stops}
            onMove={onMove}
            onRemove={onRemove}
            onSelect={onSelect}
            compact={compact}
          />
        </div>
      )}

      <div className="grid gap-4">
        <div
          aria-live="polite"
          className={cn(
            "grid gap-0.5 rounded-xl border bg-card p-3 text-sm shadow-card",
            recalculating && "opacity-60",
          )}
        >
          <span className="font-medium">
            {formatDistance(route.path.distanceMeters)} pieszo ·{" "}
            {formatMinutes(totalMinutes)}
            {recalculating && " (przeliczamy…)"}
          </span>
          {overBy > 0 && (
            <span className="text-destructive">
              O {formatMinutes(overBy)} dłużej niż Twój czas (
              {formatMinutes(availableMinutes)}).
            </span>
          )}
          {error && <span className="text-destructive">{error}</span>}
        </div>

        {!compact && (
          <Button
            type="button"
            variant="brand"
            size="xl"
            className="w-full"
            onClick={onAccept}
          >
            Zaakceptuj trasę
          </Button>
        )}
      </div>
    </section>
  );
}
