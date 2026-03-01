import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ACTIVITY_FACTORS: Record<string, number> = {
  'Sedentary': 1.2,
  'Lightly Active': 1.375,
  'Moderately Active': 1.55,
  'Very Active': 1.725,
  'Extra Active': 1.9,
};

export function calculateNutrition(profile: {
  sex: 'Male' | 'Female';
  weight: number;
  height: number;
  age: number;
  activityLevel: string;
  strategy: 'Bulking' | 'Cutting' | 'Maintenance';
}) {
  const { sex, weight, height, age, activityLevel, strategy } = profile;

  if (!weight || !height || !age) return null;

  // Mifflin-St Jeor
  let tmb = 10 * weight + 6.25 * height - 5 * age;
  tmb = sex === 'Male' ? tmb + 5 : tmb - 161;

  const tdee = tmb * (ACTIVITY_FACTORS[activityLevel] || 1.2);

  let targetCalories = tdee;
  if (strategy === 'Bulking') targetCalories += 300;
  if (strategy === 'Cutting') targetCalories -= 300;

  // Macros: P(29%), G(37%), C(34%)
  const protein = (targetCalories * 0.29) / 4;
  const fat = (targetCalories * 0.37) / 9;
  const carbs = (targetCalories * 0.34) / 4;

  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  };
}
