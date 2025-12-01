import React, { useState, useEffect } from 'react';
import { Camera as CameraIcon, Check, ChevronRight, Utensils, Flame, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { AppView, FoodAnalysis, FoodLogEntry, DailyGoal } from './types';
import { analyzeFoodImage } from './services/geminiService';
import CameraView from './components/CameraView';
import NutritionRing from './components/NutritionRing';

const INITIAL_GOALS: DailyGoal = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
};

const LOGS_STORAGE_KEY = 'calorysnap_logs_v1';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<FoodAnalysis | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [goals] = useState<DailyGoal>(INITIAL_GOALS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load logs from local storage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to load logs", e);
      }
    }
  }, []);

  // Save logs to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  // Computed totals
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleCapture = async (base64Image: string) => {
    setCurrentImage(base64Image);
    setView(AppView.ANALYZING);
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const result = await analyzeFoodImage(base64Image);
      setCurrentAnalysis(result);
      setIsAnalyzing(false);
      setView(AppView.RESULT);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      setErrorMsg("We couldn't analyze that image. Please try again or ensure the food is clearly visible.");
      setView(AppView.DASHBOARD);
    }
  };

  const handleConfirmLog = () => {
    if (currentAnalysis) {
      const newLog: FoodLogEntry = {
        ...currentAnalysis,
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUrl: currentImage || undefined,
      };
      setLogs((prev) => [newLog, ...prev]);
      setView(AppView.DASHBOARD);
      setCurrentAnalysis(null);
      setCurrentImage(null);
    }
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setLogs((prev) => prev.filter(log => log.id !== id));
    }
  };

  const renderDashboard = () => (
    <div className="pb-32 animate-fade-in bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="px-6 pt-12 pb-8 bg-white shadow-sm rounded-b-[2.5rem] relative z-10 border-b border-gray-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Calorie<span className="text-green-500">Snap</span></h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">AI Nutrition Tracker</p>
          </div>
          <div className="bg-green-100 px-4 py-1.5 rounded-full text-green-700 text-xs font-bold uppercase tracking-wide border border-green-200">
            Today
          </div>
        </div>

        {/* Main Stats Card */}
        <div className="flex justify-between items-center mb-2 px-2">
           <NutritionRing
             current={totals.calories}
             target={goals.calories}
             color="#10B981"
             label="Calories"
             unit="kcal"
             size="lg"
           />
           <div className="flex flex-col gap-5">
              <NutritionRing current={totals.protein} target={goals.protein} color="#3B82F6" label="Protein" unit="g" size="sm" />
              <NutritionRing current={totals.carbs} target={goals.carbs} color="#F59E0B" label="Carbs" unit="g" size="sm" />
              <NutritionRing current={totals.fat} target={goals.fat} color="#EF4444" label="Fat" unit="g" size="sm" />
           </div>
        </div>
      </header>

      {/* Recent Logs Section */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-end mb-5">
          <h2 className="text-xl font-bold text-gray-800">Recent Meals</h2>
          {logs.length > 0 && (
             <span className="text-xs text-gray-400 font-medium mb-1">
               {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
             </span>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm mx-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4 text-green-500">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">No meals tracked yet</h3>
            <p className="text-sm text-gray-400">Snap a photo of your food to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="group bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-center transition-all hover:shadow-md">
                {log.imageUrl ? (
                  <img
                    src={`data:image/jpeg;base64,${log.imageUrl}`}
                    alt={log.foodName}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400">
                    <Utensils className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 truncate pr-2">{log.foodName}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 truncate">{log.portionEstimate}</p>
                  <div className="flex gap-3 text-xs font-bold">
                    <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round(log.protein)}p</span>
                    <span className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">{Math.round(log.carbs)}c</span>
                    <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded">{Math.round(log.fat)}f</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="block text-lg font-extrabold text-gray-900 leading-tight">{log.calories}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">kcal</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-gray-300 hover:text-red-500 p-1 -mr-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="fixed top-6 left-6 right-6 z-50 p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl shadow-xl shadow-red-100/50 flex items-start gap-3 animate-slide-down">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <p className="text-sm font-medium">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-700">
            <Check className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => (
    <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center p-8 text-center animate-fade-in">
      <div className="relative mb-10">
        <div className="w-28 h-28 rounded-full border-4 border-t-green-500 border-white/10 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame className="w-10 h-10 text-green-500 animate-pulse" />
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-3">Analyzing Food...</h2>
      <p className="text-gray-400 max-w-xs mx-auto leading-relaxed">
        Our AI is identifying ingredients and calculating accurate nutritional values.
      </p>
    </div>
  );

  const renderResult = () => {
    if (!currentAnalysis) return null;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col animate-slide-up">
        <div className="relative h-80 shrink-0">
          {currentImage && (
            <img
              src={`data:image/jpeg;base64,${currentImage}`}
              alt="Analyzed food"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={() => {
              setView(AppView.DASHBOARD);
              setCurrentAnalysis(null);
            }}
            className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <div className="absolute bottom-8 left-6 right-6">
            <div className="inline-block px-3 py-1 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg text-green-300 text-xs font-bold uppercase tracking-wider mb-2">
              Analysis Complete
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 shadow-sm leading-tight">{currentAnalysis.foodName}</h1>
            <p className="text-white/90 font-medium text-lg">{currentAnalysis.portionEstimate}</p>
          </div>
        </div>

        <div className="flex-1 -mt-8 bg-white rounded-t-[2.5rem] relative z-10 px-8 pt-10 pb-12 flex flex-col shadow-2xl">
          
          {/* Macro Grid */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 mb-10">
             <div className="text-center px-2">
               <span className="block text-2xl font-black text-gray-900">{currentAnalysis.calories}</span>
               <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 block">Cals</span>
             </div>
             <div className="text-center px-2">
               <span className="block text-xl font-bold text-blue-600">{currentAnalysis.protein}g</span>
               <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 block">Prot</span>
             </div>
             <div className="text-center px-2">
               <span className="block text-xl font-bold text-orange-500">{currentAnalysis.carbs}g</span>
               <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 block">Carb</span>
             </div>
             <div className="text-center px-2">
               <span className="block text-xl font-bold text-red-500">{currentAnalysis.fat}g</span>
               <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 block">Fat</span>
             </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">AI Description</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm">
              {currentAnalysis.description}
            </p>
          </div>

          <div className="mt-auto space-y-4">
             <button
              onClick={handleConfirmLog}
              className="group w-full py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-2xl text-lg shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
             >
               Add to Log
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </button>
             <button
              onClick={() => {
                setView(AppView.DASHBOARD);
                setCurrentAnalysis(null);
                setCurrentImage(null);
              }}
              className="w-full py-4 bg-white border border-gray-200 text-gray-500 font-semibold rounded-2xl text-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
             >
               Discard
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-2xl overflow-hidden font-sans">
      {view === AppView.DASHBOARD && renderDashboard()}
      {view === AppView.CAMERA && <CameraView onCapture={handleCapture} onCancel={() => setView(AppView.DASHBOARD)} />}
      {view === AppView.ANALYZING && renderAnalysis()}
      {view === AppView.RESULT && renderResult()}

      {/* Floating Action Button (Only on Dashboard) */}
      {view === AppView.DASHBOARD && (
        <div className="fixed bottom-8 left-0 right-0 max-w-md mx-auto px-6 flex justify-center pointer-events-none z-30">
          <button
            onClick={() => setView(AppView.CAMERA)}
            className="pointer-events-auto bg-gray-900 hover:bg-black text-white rounded-full p-4 pl-6 pr-8 shadow-2xl shadow-gray-900/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 group"
          >
             <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
               <CameraIcon className="w-6 h-6" />
             </div>
             <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-gray-400 leading-none mb-0.5">Scan Meal</span>
                <span className="font-bold text-lg leading-none">Snap Food</span>
             </div>
          </button>
        </div>
      )}
    </div>
  );
}