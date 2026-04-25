import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { 
  Activity, ShieldAlert, ArrowUpRight, ArrowDownRight, 
  Database, Server, Search, Filter 
} from 'lucide-react';

// Datos con varianza realista (no lineales)
const riskTrendData = [
  { time: '00:00', volumen: 2100, anomalias: 12 },
  { time: '04:00', volumen: 850, anomalias: 3 },
  { time: '08:00', volumen: 4200, anomalias: 45 },
  { time: '12:00', volumen: 7800, anomalias: 112 },
  { time: '16:00', volumen: 6500, anomalias: 89 },
  { time: '20:00', volumen: 5100, anomalias: 67 },
  { time: '23:59', volumen: 3200, anomalias: 24 },
];

const segmentRiskData = [
  { segment: 'Retail', riskScore: 84 },
  { segment: 'Pyme', riskScore: 45 },
  { segment: 'Corp', riskScore: 12 },
  { segment: 'E-com', riskScore: 68 },
];

const recentAlerts = [
  { id: 'AL-9921', type: 'Patrón Inusual', amount: '$14,500.00', status: 'Revisión', time: 'Hace 2 min' },
  { id: 'AL-9920', type: 'IP Sospechosa', amount: '$2,100.00', status: 'Bloqueado', time: 'Hace 15 min' },
  { id: 'AL-9919', type: 'Multicuenta', amount: 'N/A', status: 'Investigando', time: 'Hace 42 min' },
  { id: 'AL-9918', type: 'Límite Excedido', amount: '$45,000.00', status: 'Bloqueado', time: 'Hace 1 hora' },
];

export const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-900 animate-in fade-in duration-500">
      
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Métricas de Rendimiento</h1>
          <p className="text-sm text-slate-500 mt-1">Análisis predictivo y detección de anomalías en tiempo real.</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-slate-600 font-medium">
            <Server size={14} />
            <span>API Conectada</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md font-medium border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Modelos IA: Activos
          </div>
        </div>
      </div>

      {/* Grid de KPIs - Estilo Banco/Fintech */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Volumen Transaccional', value: '28,450', diff: '+14.2%', isPositive: true },
          { title: 'Anomalías Detectadas', value: '352', diff: '-2.4%', isPositive: true }, // Menos anomalías es positivo
          { title: 'Tasa de Falsos Positivos', value: '1.2%', diff: '+0.1%', isPositive: false },
          { title: 'Latencia de Inferencia', value: '45ms', diff: '-12ms', isPositive: true },
        ].map((metric, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-slate-500">{metric.title}</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900">{metric.value}</span>
              <span className={`flex items-center text-xs font-medium ${metric.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {metric.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {metric.diff}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sección Analítica Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfica de Área (Toma 2 columnas) */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-900">Tráfico vs. Riesgo Detectado (24h)</h3>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Exportar CSV</button>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolumen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="volumen" name="Volumen Total" stroke="#6366f1" fillOpacity={1} fill="url(#colorVolumen)" strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Barras */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Índice de Riesgo por Segmento</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentRiskData} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="segment" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="riskScore" name="Puntaje de Riesgo" radius={[0, 4, 4, 0]} barSize={24}>
                  {segmentRiskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.riskScore > 70 ? '#ef4444' : entry.riskScore > 40 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla de Datos Reales (Crucial para el realismo corporativo) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={18} className="text-slate-500" />
            Intervenciones Recientes del Modelo
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Buscar ID..." className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <button className="p-1.5 border border-slate-300 rounded-md text-slate-500 hover:bg-slate-50">
              <Filter size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">ID Evento</th>
                <th className="px-6 py-3">Clasificación IA</th>
                <th className="px-6 py-3">Monto Involucrado</th>
                <th className="px-6 py-3">Tiempo</th>
                <th className="px-6 py-3">Estado Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAlerts.map((alert, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3 font-mono text-slate-600">{alert.id}</td>
                  <td className="px-6 py-3 text-slate-900 font-medium">{alert.type}</td>
                  <td className="px-6 py-3 text-slate-600">{alert.amount}</td>
                  <td className="px-6 py-3 text-slate-500">{alert.time}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      alert.status === 'Bloqueado' ? 'bg-red-50 border-red-200 text-red-700' : 
                      alert.status === 'Revisión' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                      'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};