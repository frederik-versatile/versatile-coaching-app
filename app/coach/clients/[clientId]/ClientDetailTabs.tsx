"use client";

import { useState } from "react";
import { upcomingMonday } from "@/lib/days";
import WeekStrip, { type DayState } from "@/components/WeekStrip";
import type { WorkoutType } from "@/lib/workoutTypes";
import PhotoGrid from "@/app/client/dashboard/PhotoGrid";
import ProgressCharts from "@/app/client/dashboard/ProgressCharts";
import WeekGrid from "./WeekGrid";
import PlanHeader from "./PlanHeader";
import MacroSplitSection from "./MacroSplitSection";
import MealPlanSection from "./MealPlanSection";
import { createWeeklyPlan } from "./actions";
import type { GalleryPhoto } from "@/app/client/dashboard/PhotoGrid";
import type { MacroSplit, MealPlan } from "@/lib/nutrition";

type Exercise = {
  id: string;
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  target_rest_seconds: number | null;
  target_duration_minutes: number | null;
  target_distance_km: number | null;
  target_pace: string | null;
  notes: string | null;
};

type Workout = {
  id: string;
  day_of_week: number;
  time_slot: "am" | "midday" | "pm";
  workout_type: WorkoutType;
  name: string;
  weekly_plan_id: string;
  exercises: Exercise[];
};

type Template = {
  id: string;
  name: string;
  workout_type: WorkoutType;
  template_exercises: { id: string }[];
};

type Plan = { id: string; week_start: string; notes: string | null };

const TABS = ["Plan", "Progress", "Nutrition", "Photos"] as const;
type Tab = (typeof TABS)[number];

export default function ClientDetailTabs({
  clientId,
  plans,
  workouts,
  templates,
  dayStatesByPlanId,
  workoutLogCountByPlanId,
  photos,
  macroSplits,
  mealPlans,
}: {
  clientId: string;
  plans: Plan[];
  workouts: Workout[];
  templates: Template[];
  dayStatesByPlanId: Record<string, DayState[]>;
  workoutLogCountByPlanId: Record<string, number>;
  photos: GalleryPhoto[];
  macroSplits: MacroSplit[];
  mealPlans: MealPlan[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Plan");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plans[0]?.id ?? null
  );
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
  const selectedPlanWorkouts = selectedPlanId
    ? workouts.filter((w) => w.weekly_plan_id === selectedPlanId)
    : [];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Client detail sections"
        className="flex gap-1 border-b border-neutral"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-3 py-2 text-body-sm transition-colors ${
              activeTab === tab
                ? "border-accent font-medium text-ink"
                : "border-transparent text-charcoal hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Plan" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <label htmlFor="week-switcher" className="block text-caption text-charcoal">
                Week
              </label>
              {plans.length === 0 ? (
                <p className="text-body text-charcoal">No weekly plans yet.</p>
              ) : (
                <select
                  id="week-switcher"
                  value={selectedPlanId ?? ""}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="rounded border border-neutral bg-white px-3 py-2 text-body text-ink focus:border-accent"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      Week of {plan.week_start}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowNewPlanForm((s) => !s)}
              className="rounded bg-accent px-4 py-2 text-body-sm font-medium text-white transition-colors hover:opacity-90"
            >
              + New weekly plan
            </button>
          </div>

          {showNewPlanForm && (
            <form
              action={createWeeklyPlan}
              className="space-y-3 rounded border border-accent bg-background p-4"
            >
              <input type="hidden" name="client_id" value={clientId} />
              <div className="space-y-1">
                <label htmlFor="week_start" className="block text-body-sm text-charcoal">
                  Week start (Monday)
                </label>
                <input
                  id="week_start"
                  name="week_start"
                  type="date"
                  required
                  defaultValue={upcomingMonday()}
                  className="rounded border border-neutral px-3 py-2 font-mono text-data tabular-nums text-ink focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="notes" className="block text-body-sm text-charcoal">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  className="w-full rounded border border-neutral px-3 py-2 text-body text-ink focus:border-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-accent px-4 py-2 text-body-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  Create weekly plan
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPlanForm(false)}
                  className="rounded border border-neutral px-4 py-2 text-body-sm text-ink transition-colors hover:bg-background"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {selectedPlan && (
            <>
              <PlanHeader
                clientId={clientId}
                planId={selectedPlan.id}
                weekStart={selectedPlan.week_start}
                notes={selectedPlan.notes}
                workoutLogCount={workoutLogCountByPlanId[selectedPlan.id] ?? 0}
              />
              <div className="rounded border border-neutral bg-background p-3">
                <WeekStrip states={dayStatesByPlanId[selectedPlan.id]} />
              </div>
              <WeekGrid
                workouts={selectedPlanWorkouts}
                templates={templates}
                clientId={clientId}
                planId={selectedPlan.id}
              />
            </>
          )}
        </div>
      )}

      {activeTab === "Progress" && <ProgressCharts clientId={clientId} />}

      {activeTab === "Nutrition" && (
        <div className="space-y-3">
          <MacroSplitSection clientId={clientId} macroSplits={macroSplits} />
          <MealPlanSection clientId={clientId} mealPlans={mealPlans} />
        </div>
      )}

      {activeTab === "Photos" && (
        <PhotoGrid photos={photos} emptyMessage="No progress photos yet." />
      )}
    </div>
  );
}
