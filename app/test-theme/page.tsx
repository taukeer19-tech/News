"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, Palette } from "lucide-react";
import { useEffect, useState } from "react";

export default function TestTheme() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-3xl font-bold text-white mb-6 flex justify-center items-center gap-3">
            <Palette className="w-8 h-8 text-indigo-400" />
            Global Theme Demonstrator
        </h2>
        {mounted && (
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
              <button 
                onClick={() => setTheme("glass")}
                className={`w-64 p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'glass' ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-black/20 border-white/5 border hover:bg-white/5 text-white/50'}`}
              >
                <Moon className={`w-8 h-8 ${theme === 'glass' ? 'text-indigo-400' : 'text-white/40'}`} />
                <div className="text-center">
                    <span className={`block font-bold text-lg ${theme === 'glass' ? 'text-indigo-300' : 'text-white'}`}>Glassmorphism</span>
                    <span className="text-xs text-white/50 block mt-1">Frosted Glass</span>
                </div>
              </button>
              <button 
                onClick={() => setTheme("aesthetic")}
                className={`w-64 p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'aesthetic' ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-black/20 border-white/5 border hover:bg-white/5 text-white/50'}`}
              >
                <Sun className={`w-8 h-8 ${theme === 'aesthetic' ? 'text-emerald-400' : 'text-white/40'}`} />
                <div className="text-center">
                    <span className={`block font-bold text-lg ${theme === 'aesthetic' ? 'text-emerald-500' : 'text-white'}`}>Aesthetic Appeal</span>
                    <span className="text-xs text-white/50 block mt-1">Solid Clean Elements</span>
                </div>
              </button>
            </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Sample UI Panel</h3>
          <p className="text-white/60 mb-6">This panel's background color, borders, typography, and shadow automatically adapt based on your chosen theme using global CSS cascade rules.</p>
          
          <div className="space-y-4">
              <input type="text" placeholder="Sample Input Element" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <div className="flex gap-4 pt-2">
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl transition-colors font-medium">Primary Button</button>
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl transition-colors font-medium">Secondary Action</button>
                  <button className="border border-white/20 text-white hover:bg-white/5 px-6 py-2.5 rounded-xl transition-colors font-medium">Soft Action</button>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
