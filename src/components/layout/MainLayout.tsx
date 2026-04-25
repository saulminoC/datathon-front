// src/components/layout/MainLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit } from 'lucide-react';

export const MainLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Modularizado */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-blue-600">VitalData</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${location.pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link to="/predicciones" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${location.pathname === '/predicciones' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            <BrainCircuit size={20} />
            <span className="font-medium">Motor IA</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-700">Panel de Control</h2>
        </header>
        <div className="p-8">
          {/* Aquí React Router inyecta la página que corresponda */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};