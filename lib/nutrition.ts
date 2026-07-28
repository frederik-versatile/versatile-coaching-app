export type MealBlock = {
  label: string;
  description: string;
};

export type MacroSplit = {
  id: string;
  effective_date: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export type MealPlan = {
  id: string;
  effective_date: string;
  content: MealBlock[];
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// "Current" is the latest effective_date that has actually arrived, not the
// most recently created row — a coach can schedule a future change without
// it taking effect early.
export function pickCurrent<T extends { effective_date: string }>(
  rowsDescByDate: T[]
): T | null {
  const now = today();
  return rowsDescByDate.find((row) => row.effective_date <= now) || null;
}
