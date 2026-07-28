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
      <h2 className="text-lg font-medium text-ink">Nutrition</h2>

      <div className="space-y-3 rounded-lg border border-neutral bg-white p-4">
        <div>
          <h3 className="font-medium text-ink">Macro split</h3>
          {currentMacros ? (
            <p className="text-charcoal">
              {currentMacros.calories ?? "—"} kcal ·{" "}
              {currentMacros.protein_g ?? "—"}g protein ·{" "}
              {currentMacros.carbs_g ?? "—"}g carbs · {currentMacros.fat_g ?? "—"}g
              fat
              <span className="block text-xs text-charcoal">
                Since {currentMacros.effective_date}
              </span>
            </p>
          ) : (
            <p className="text-charcoal">No macro split set yet.</p>
          )}
        </div>

        <div>
          <h3 className="font-medium text-ink">Meal plan</h3>
          {currentMealPlan ? (
            <>
              <p className="text-xs text-charcoal">
                Since {currentMealPlan.effective_date}
              </p>
              <MealBlocksView blocks={currentMealPlan.content} />
            </>
          ) : (
            <p className="text-charcoal">No meal plan set yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
