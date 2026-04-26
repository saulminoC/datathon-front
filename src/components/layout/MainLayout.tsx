// src/components/layout/MainLayout.tsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, ShieldAlert, Users, LogOut } from 'lucide-react'; // Añadimos Users

import GlobalKPIs from './GlobalKPIs';

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-indigo-600">system 32</h1>
          </div>
          <nav className="p-4 space-y-2">
            <Link 
              to="/panel" 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === '/panel' || location.pathname === '/panel/' 
                  ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* --- NUEVA PESTAÑA DE CLIENTES --- */}
            <Link 
              to="/panel/clientes" 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname.includes('/panel/clientes') 
                  ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Users size={20} />
              <span className="font-medium">Clientes</span>
            </Link>
            
            <Link 
              to="/panel/predicciones" 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === '/panel/predicciones' 
                  ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <BrainCircuit size={20} />
              <span className="font-medium">Motor IA</span>
            </Link>

            <Link 
              to="/panel/riesgo-alto" 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === '/panel/riesgo-alto' 
                  ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert size={20} />
              <span className="font-medium">Top Riesgo</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <GlobalKPIs />
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};