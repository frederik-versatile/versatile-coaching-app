import type { MacroSplit, MealPlan } from "@/lib/nutrition";
import MealBlocksView from "./MealBlocksView";

export default function NutritionView({
  currentMacros,
  currentMealPlan,
}: {
  currentMacros: MacroSplit | null;
  currentMealPlan: MealPlan | null;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-display-sm text-ink">Nutrition</h2>

      <div className="space-y-3 rounded border border-neutral bg-white p-4">
        <div>
          <h3 className="text-body font-medium text-ink">Macro split</h3>
          {currentMacros ? (
            <p className="font-mono text-data tabular-nums text-charcoal">
              {currentMacros.calories ?? "—"} kcal ·{" "}
              {currentMacros.protein_g ?? "—"}g protein ·{" "}
              {currentMacros.carbs_g ?? "—"}g carbs · {currentMacros.fat_g ?? "—"}g
              fat
              <span className="block text-caption">
                Since {currentMacros.effective_date}
              </span>
            </p>
          ) : (
            <p className="text-body text-charcoal">
              No macro split yet — your coach will add one here.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-body font-medium text-ink">Meal plan</h3>
          {currentMealPlan ? (
            <>
              <p className="font-mono text-caption tabular-nums text-charcoal">
                Since {currentMealPlan.effective_date}
              </p>
              <MealBlocksView blocks={currentMealPlan.content} />
            </>
          ) : (
            <p className="text-body text-charcoal">
              No meal plan yet — your coach will add one here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
