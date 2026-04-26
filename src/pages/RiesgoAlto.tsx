import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  ShieldAlert
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface TopRiesgoItem {
  id: string;
  estado: string;
  ciudad: string;
  score: number;
  sat: number;
  login: number;
  prods: number;
  txs: number;
  ingreso: number;
}

const ScoreBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 80 ? 'bg-rose-500' : value >= 60 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${
        value >= 80 ? 'text-rose-600' : value >= 60 ? 'text-amber-600' : 'text-emerald-600'
      }`}>
        {value}
      </span>
    </div>
  );
};

export const RiesgoAlto: React.FC = () => {
  const [clientes, setClientes] = useState<TopRiesgoItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ── Estado para el filtro de búsqueda ──
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/dashboard/clientes-riesgo-alto?page_size=20`);
        const data = await response.json();
        
        const topMapped: TopRiesgoItem[] = data.data.map((d: any) => ({
          id:      d.user_id,
          estado:  d.estado,
          ciudad:  d.ciudad,
          score:   d.churn_score,
          sat:     d.satisfaccion_1_10 ?? 0,
          login:   d.dias_desde_ultimo_login,
          prods:   d.num_productos_activos ?? 0,
          txs:     d.total_tx ?? 0,
          ingreso: d.ingreso_mensual_mxn ?? 0,
        }));
        
        setClientes(topMapped.sort((a, b) => b.score - a.score));
      } catch (err) {
        console.error("Error cargando clientes de riesgo alto:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // ── Lógica del Filtro en vivo (Keyup) ──
  const clientesFiltrados = clientes.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* ── Encabezado ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
              <ShieldAlert size={20} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Intervención Prioritaria</h1>
          </div>
          <p className="text-sm text-slate-500">
            Listado nominal de clientes con mayor probabilidad de abandono (Churn).
          </p>
        </div>
      </div>

      {/* ── Contenedor principal ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Barra de herramientas (Búsqueda en Vivo) */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-lg w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe para buscar por ID, estado o ciudad..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">ID Cliente</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Riesgo IA (Churn)</th>
                <th className="px-6 py-4 text-center">Satisfacción</th>
                <th className="px-6 py-4">Sin Login</th>
                <th className="px-6 py-4 text-right">Transacciones</th>
                <th className="px-6 py-4 text-right">Ingreso Mensual</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-400 font-medium">Analizando perfiles de riesgo...</p>
                    </div>
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                    No se encontraron clientes que coincidan con la búsqueda "{searchTerm}".
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {r.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[13px] font-bold text-slate-700">{r.estado}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.ciudad}</p>
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBar value={r.score} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        r.sat <= 4 ? 'bg-rose-100 text-rose-600' : r.sat <= 7 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {r.sat}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-semibold text-rose-500">{r.login} días</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[13px] font-medium text-slate-600">{r.txs}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[13px] font-bold text-slate-700">
                        ${r.ingreso.toLocaleString('es-MX')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer dinámico */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-sm text-slate-500">
          <span>
            Mostrando <span className="font-bold text-indigo-600">{clientesFiltrados.length}</span> resultados
          </span>
        </div>

      </div>
    </div>
  );
};

export default RiesgoAlto;