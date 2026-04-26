// src/components/layout/MainLayout.tsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, ShieldAlert, LogOut } from 'lucide-react';

// 1. Importamos tu nuevo componente de KPIs Globales
// (Ajusta esta ruta dependiendo de en qué carpeta guardaste GlobalKPIs.tsx)
import GlobalKPIs from './GlobalKPIs';

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Si en el Datathon implementan un AuthContext o LocalStorage, 
    // aquí lo limpiarías antes de redirigir:
    // localStorage.removeItem('token');
    
    // Redirigimos al Login
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Modularizado */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        
        {/* Contenedor Superior (Logo y Navegación) */}
        <div>
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-indigo-600">system 32</h1>
          </div>
          <nav className="p-4 space-y-2">
            <Link 
              to="/panel" 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === '/panel' || location.pathname === '/panel/' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link 
              to="/panel/predicciones" 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === '/panel/predicciones' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <BrainCircuit size={20} />
              <span className="font-medium">Motor IA</span>
            </Link>

            <Link 
              to="/panel/riesgo-alto" 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === '/panel/riesgo-alto' 
                  ? 'bg-rose-50 text-rose-700' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert size={20} />
              <span className="font-medium">Top Riesgo</span>
            </Link>

          </nav>
        </div>

        {/* Contenedor Inferior (Cerrar Sesión) */}
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

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          
          {/* === AQUÍ ESTÁ LA MAGIA === */}
          {/* Este componente siempre se verá en todas las pestañas */}
          <GlobalKPIs />

          {/* Aquí React Router inyecta la página que corresponda (Dashboard, Motor IA, etc) */}
          <Outlet /> 
          
        </div>
      </main>
    </div>
  );
};