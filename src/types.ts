export type Strategy = 'Bulking' | 'Cutting' | 'Maintenance';
export type Sex = 'Male' | 'Female';
export type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';

export interface UserProfile {
  strategy: Strategy;
  sex: Sex;
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
}

export interface CalculatedMacros {
  tmb: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface FoodItem {
  id: string;
  name: string;
  amount: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Meal {
  id: string;
  name: string;
  items: FoodItem[];
}

export interface DietPlan {
  profile: UserProfile;
  calculated: CalculatedMacros;
  meals: Meal[];
}
