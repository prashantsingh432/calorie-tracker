export interface FoodAnalysis {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  portionEstimate: string;
}

export interface FoodLogEntry extends FoodAnalysis {
  id: string;
  timestamp: number;
  imageUrl?: string;
}

export interface DailyGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
}

export interface AnalysisError {
  message: string;
  isNotFood?: boolean;
}