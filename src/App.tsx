import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  FileDown, 
  ChevronRight,
  Activity,
  User,
  Target,
  Utensils,
  Search,
  LogIn,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn, calculateNutrition } from './utils';
import { FOOD_DATABASE } from './constants';
import { supabase } from './lib/supabase';
import { 
  UserProfile, 
  CalculatedMacros, 
  DietPlan, 
  Meal, 
  FoodItem,
  Strategy,
  Sex,
  ActivityLevel
} from './types';

export default function App() {
  const [view, setView] = useState<'setup' | 'dashboard'>('setup');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    strategy: 'Maintenance',
    sex: 'Male',
    age: 30,
    weight: 75,
    height: 175,
    activityLevel: 'Moderately Active'
  });

  const [meals, setMeals] = useState<Meal[]>([
    { id: '1', name: 'Café da Manhã', items: [] },
    { id: '2', name: 'Almoço', items: [] }
  ]);

  const calculated = useMemo(() => calculateNutrition(profile), [profile]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlan(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlan(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPlan = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setProfile({
          strategy: data.strategy as Strategy,
          sex: data.sex as Sex,
          age: data.age,
          weight: data.weight,
          height: data.height,
          activityLevel: data.activity_level as ActivityLevel
        });
        setMeals(data.meals);
        setView('dashboard');
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (currentMeals: Meal[]) => {
    if (!user || !supabase) return;

    try {
      const { error } = await supabase
        .from('diet_plans')
        .upsert({
          user_id: user.id,
          strategy: profile.strategy,
          sex: profile.sex,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          activity_level: profile.activityLevel,
          calculated_macros: calculated,
          meals: currentMeals,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving plan:', err);
    }
  };

  const handleLogin = async () => {
    if (!supabase) {
      alert('Supabase não está configurado. Verifique as variáveis de ambiente.');
      return;
    }
    const email = prompt('Digite seu email para login (Magic Link):');
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) alert(error.message);
      else alert('Verifique seu email para o link de acesso!');
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setView('setup');
    setMeals([
      { id: '1', name: 'Café da Manhã', items: [] },
      { id: '2', name: 'Almoço', items: [] }
    ]);
  };

  const handleStart = () => {
    if (calculated) {
      setView('dashboard');
      savePlan(meals);
    }
  };

  const addMeal = () => {
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: `Refeição ${meals.length + 1}`,
      items: []
    };
    const updated = [...meals, newMeal];
    setMeals(updated);
    savePlan(updated);
  };

  const removeMeal = (id: string) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    savePlan(updated);
  };

  const addFood = (mealId: string) => {
    const updated = meals.map(m => {
      if (m.id === mealId) {
        return {
          ...m,
          items: [...m.items, {
            id: Date.now().toString(),
            name: '',
            amount: 100,
            kcal: 0,
            protein: 0,
            fat: 0,
            carbs: 0
          }]
        };
      }
      return m;
    });
    setMeals(updated);
    savePlan(updated);
  };

  const updateFood = (mealId: string, foodId: string, updates: Partial<FoodItem>) => {
    const updated = meals.map(m => {
      if (m.id === mealId) {
        return {
          ...m,
          items: m.items.map(f => {
            if (f.id === foodId) {
              const newFood = { ...f, ...updates };
              
              // If name changed, check if it matches a database item
              if (updates.name !== undefined) {
                const dbItem = FOOD_DATABASE.find(db => db.nome === updates.name);
                if (dbItem) {
                  // Base values are usually per 100g unless isUnit is true
                  const baseWeight = dbItem.isUnit ? (dbItem.unitWeight || 100) : 100;
                  const ratio = newFood.amount / baseWeight;
                  
                  newFood.kcal = Number((dbItem.kcal * ratio).toFixed(1));
                  newFood.protein = Number((dbItem.proteina * ratio).toFixed(1));
                  newFood.fat = Number((dbItem.gordura * ratio).toFixed(1));
                  newFood.carbs = Number((dbItem.carboidrato * ratio).toFixed(1));
                }
              }
              
              // If amount changed, recalculate based on current name if it exists in DB
              if (updates.amount !== undefined) {
                const dbItem = FOOD_DATABASE.find(db => db.nome === newFood.name);
                if (dbItem) {
                  const baseWeight = dbItem.isUnit ? (dbItem.unitWeight || 100) : 100;
                  const ratio = updates.amount / baseWeight;
                  
                  newFood.kcal = Number((dbItem.kcal * ratio).toFixed(1));
                  newFood.protein = Number((dbItem.proteina * ratio).toFixed(1));
                  newFood.fat = Number((dbItem.gordura * ratio).toFixed(1));
                  newFood.carbs = Number((dbItem.carboidrato * ratio).toFixed(1));
                }
              }

              return newFood;
            }
            return f;
          })
        };
      }
      return m;
    });
    setMeals(updated);
    savePlan(updated);
  };

  const removeFood = (mealId: string, foodId: string) => {
    const updated = meals.map(m => {
      if (m.id === mealId) {
        return {
          ...m,
          items: m.items.filter(f => f.id !== foodId)
        };
      }
      return m;
    });
    setMeals(updated);
    savePlan(updated);
  };

  const totals = useMemo(() => {
    return meals.reduce((acc, meal) => {
      meal.items.forEach(item => {
        acc.kcal += Number(item.kcal) || 0;
        acc.protein += Number(item.protein) || 0;
        acc.fat += Number(item.fat) || 0;
        acc.carbs += Number(item.carbs) || 0;
      });
      return acc;
    }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });
  }, [meals]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('Plano Nutricional Profissional', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${date}`, 160, 22);

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumo da Estratégia', 14, 35);
    
    autoTable(doc, {
      startY: 40,
      head: [['Estratégia', 'Meta Calórica', 'Proteínas', 'Gorduras', 'Carboidratos']],
      body: [[
        profile.strategy,
        `${calculated?.targetCalories} kcal`,
        `${calculated?.protein}g`,
        `${calculated?.fat}g`,
        `${calculated?.carbs}g`
      ]],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Meals
    meals.forEach((meal, index) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.text(meal.name, 14, currentY);
      
      const mealRows = meal.items.map(item => [
        item.name || 'Alimento',
        `${item.amount}g`,
        `${item.kcal} kcal`,
        `${item.protein}g`,
        `${item.fat}g`,
        `${item.carbs}g`
      ]);

      const mealTotal = meal.items.reduce((acc, item) => ({
        kcal: acc.kcal + (Number(item.kcal) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        fat: acc.fat + (Number(item.fat) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0)
      }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Alimento', 'Qtd', 'Kcal', 'Prot', 'Gord', 'Carb']],
        body: [
          ...mealRows,
          [{ content: 'Total da Refeição', colSpan: 2, styles: { fontStyle: 'bold' } }, 
           `${mealTotal.kcal} kcal`, `${mealTotal.protein}g`, `${mealTotal.fat}g`, `${mealTotal.carbs}g`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94] },
        margin: { bottom: 20 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`plano-nutricional-${date.replace(/\//g, '-')}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans selection:bg-emerald-500/30">
      {!supabase && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-center gap-3 text-amber-500 text-xs font-medium">
          <AlertTriangle className="w-4 h-4" />
          Supabase não configurado. Adicione as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
        </div>
      )}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-end">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">{user.email}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Entrar / Cadastrar
          </button>
        )}
      </nav>
      <AnimatePresence mode="wait">
        {view === 'setup' ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-5xl mx-auto px-6 py-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Calculator className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Configuração Nutricional</h1>
                <p className="text-slate-400">Calcule suas necessidades basais e defina sua estratégia.</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#1a1d23] border border-white/5 rounded-3xl p-8 shadow-xl">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Estratégia</label>
                      <select 
                        value={profile.strategy}
                        onChange={e => setProfile({...profile, strategy: e.target.value as Strategy})}
                        className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      >
                        <option>Bulking</option>
                        <option>Cutting</option>
                        <option>Maintenance</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Sexo</label>
                      <div className="flex gap-2">
                        {['Male', 'Female'].map(s => (
                          <button
                            key={s}
                            onClick={() => setProfile({...profile, sex: s as Sex})}
                            className={cn(
                              "flex-1 py-3 rounded-xl border transition-all text-sm font-medium",
                              profile.sex === s 
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                : "bg-[#0f1115] border-white/10 text-slate-400 hover:border-white/20"
                            )}
                          >
                            {s === 'Male' ? 'Masculino' : 'Feminino'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Idade</label>
                      <input 
                        type="number"
                        value={profile.age}
                        onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                        className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Nível de Atividade</label>
                      <select 
                        value={profile.activityLevel}
                        onChange={e => setProfile({...profile, activityLevel: e.target.value as ActivityLevel})}
                        className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      >
                        <option>Sedentary</option>
                        <option>Lightly Active</option>
                        <option>Moderately Active</option>
                        <option>Very Active</option>
                        <option>Extra Active</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Peso (kg)</label>
                      <input 
                        type="number"
                        value={profile.weight}
                        onChange={e => setProfile({...profile, weight: Number(e.target.value)})}
                        className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Altura (cm)</label>
                      <input 
                        type="number"
                        value={profile.height}
                        onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                        className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#1a1d23] border border-white/5 rounded-3xl p-8 shadow-xl sticky top-8">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Resultados Estimados
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-[#0f1115] rounded-2xl border border-white/5">
                      <span className="text-sm text-slate-400">TMB</span>
                      <span className="text-xl font-bold text-white">{calculated?.tmb} <span className="text-xs text-slate-500 font-normal">kcal</span></span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-[#0f1115] rounded-2xl border border-white/5">
                      <span className="text-sm text-slate-400">Gasto Total (TDEE)</span>
                      <span className="text-xl font-bold text-white">{calculated?.tdee} <span className="text-xs text-slate-500 font-normal">kcal</span></span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <span className="text-sm text-emerald-500 font-medium">Calorias Alvo</span>
                      <span className="text-2xl font-black text-emerald-500">{calculated?.targetCalories} <span className="text-xs font-normal opacity-70">kcal</span></span>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Proteínas (29%)</span>
                      <span className="text-white font-bold">{calculated?.protein}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Gorduras (37%)</span>
                      <span className="text-white font-bold">{calculated?.fat}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Carboidratos (34%)</span>
                      <span className="text-white font-bold">{calculated?.carbs}g</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleStart}
                    className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    Montar Dieta
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-6 py-8"
          >
            {/* Header Status */}
            <header className="bg-[#1a1d23] border border-white/5 rounded-3xl p-6 mb-8 shadow-2xl sticky top-4 z-50 backdrop-blur-xl bg-opacity-90">
              <div className="grid md:grid-cols-4 gap-6 items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <LayoutDashboard className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Dashboard</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">{profile.strategy}</p>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-4 gap-4">
                  {[
                    { label: 'Kcal', current: totals.kcal, target: calculated?.targetCalories, color: 'text-emerald-500' },
                    { label: 'Prot', current: totals.protein, target: calculated?.protein, color: 'text-blue-400' },
                    { label: 'Gord', current: totals.fat, target: calculated?.fat, color: 'text-amber-400' },
                    { label: 'Carb', current: totals.carbs, target: calculated?.carbs, color: 'text-purple-400' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{stat.label}</p>
                      <p className={cn("text-sm font-black", stat.color)}>
                        {Math.round(stat.current)} <span className="text-slate-600 font-normal">/ {stat.target}</span>
                      </p>
                      <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", stat.color.replace('text-', 'bg-'))}
                          style={{ width: `${Math.min((stat.current / (stat.target || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setView('setup')}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400"
                    title="Ajustar Perfil"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={generatePDF}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <FileDown className="w-5 h-5" />
                    Exportar PDF
                  </button>
                </div>
              </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Column: Meals */}
              <div className="lg:col-span-8 space-y-8">
                {meals.map((meal, mIdx) => (
                  <motion.section 
                    key={meal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#1a1d23] border border-white/5 rounded-3xl overflow-hidden shadow-xl"
                  >
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <Utensils className="w-5 h-5 text-slate-400" />
                        </div>
                        <input 
                          value={meal.name}
                          onChange={e => {
                            const updated = meals.map(m => m.id === meal.id ? {...m, name: e.target.value} : m);
                            setMeals(updated);
                            savePlan(updated);
                          }}
                          className="bg-transparent text-xl font-bold text-white outline-none focus:text-emerald-500 transition-colors"
                        />
                      </div>
                      <button 
                        onClick={() => removeMeal(meal.id)}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-white/5">
                              <th className="pb-4 pl-2">Alimento</th>
                              <th className="pb-4">Qtd (g)</th>
                              <th className="pb-4">Kcal</th>
                              <th className="pb-4">Prot</th>
                              <th className="pb-4">Gord</th>
                              <th className="pb-4">Carb</th>
                              <th className="pb-4 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {meal.items.map((item) => (
                              <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 pl-2">
                                  <div className="relative">
                                    <input 
                                      list={`foods-${meal.id}-${item.id}`}
                                      placeholder="Buscar alimento..."
                                      value={item.name}
                                      onChange={e => updateFood(meal.id, item.id, { name: e.target.value })}
                                      className="bg-transparent text-sm text-white outline-none w-full focus:text-emerald-400"
                                    />
                                    <datalist id={`foods-${meal.id}-${item.id}`}>
                                      {FOOD_DATABASE.map(db => (
                                        <option key={db.nome} value={db.nome} />
                                      ))}
                                    </datalist>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <input 
                                    type="number"
                                    value={item.amount}
                                    onChange={e => updateFood(meal.id, item.id, { amount: Number(e.target.value) })}
                                    className="bg-[#0f1115] border border-white/5 rounded px-2 py-1 text-sm text-slate-400 outline-none w-20 focus:border-emerald-500/50"
                                  />
                                </td>
                                <td className="py-3">
                                  <input 
                                    type="number"
                                    value={item.kcal}
                                    readOnly
                                    className="bg-transparent text-sm text-emerald-500 font-bold outline-none w-16 cursor-default"
                                    title="Calculado automaticamente"
                                  />
                                </td>
                                <td className="py-3">
                                  <input 
                                    type="number"
                                    value={item.protein}
                                    readOnly
                                    className="bg-transparent text-sm text-blue-400 outline-none w-12 cursor-default"
                                    title="Calculado automaticamente"
                                  />
                                </td>
                                <td className="py-3">
                                  <input 
                                    type="number"
                                    value={item.fat}
                                    readOnly
                                    className="bg-transparent text-sm text-amber-400 outline-none w-12 cursor-default"
                                    title="Calculado automaticamente"
                                  />
                                </td>
                                <td className="py-3">
                                  <input 
                                    type="number"
                                    value={item.carbs}
                                    readOnly
                                    className="bg-transparent text-sm text-purple-400 outline-none w-12 cursor-default"
                                    title="Calculado automaticamente"
                                  />
                                </td>
                                <td className="py-3 text-right pr-2">
                                  <button 
                                    onClick={() => removeFood(meal.id, item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button 
                        onClick={() => addFood(meal.id)}
                        className="w-full mt-4 py-3 border border-dashed border-white/10 rounded-xl text-slate-500 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Alimento
                      </button>
                    </div>
                  </motion.section>
                ))}

                <button 
                  onClick={addMeal}
                  className="w-full py-6 border-2 border-dashed border-white/5 rounded-3xl text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Plus className="w-8 h-8" />
                  <span className="font-bold">Nova Refeição</span>
                </button>
              </div>

              {/* Right Column: Analytics */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-[#1a1d23] border border-white/5 rounded-3xl p-8 shadow-xl sticky top-32">
                  <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    Distribuição de Macros
                  </h3>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Proteína', value: totals.protein * 4, color: '#60a5fa' },
                            { name: 'Gordura', value: totals.fat * 9, color: '#fbbf24' },
                            { name: 'Carbo', value: totals.carbs * 4, color: '#a78bfa' },
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#60a5fa', '#fbbf24', '#a78bfa'][index]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1d23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4 mt-4">
                    {[
                      { label: 'Proteína', value: totals.protein, target: calculated?.protein, color: 'bg-blue-400' },
                      { label: 'Gordura', value: totals.fat, target: calculated?.fat, color: 'bg-amber-400' },
                      { label: 'Carboidratos', value: totals.carbs, target: calculated?.carbs, color: 'bg-purple-400' },
                    ].map(macro => (
                      <div key={macro.label} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-slate-500">{macro.label}</span>
                          <span className="text-white">{Math.round(macro.value)}g <span className="text-slate-600">/ {macro.target}g</span></span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-700", macro.color)}
                            style={{ width: `${Math.min((macro.value / (macro.target || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
