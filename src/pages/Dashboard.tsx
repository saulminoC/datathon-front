import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Activity, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ✅ Puerto correcto — igual que GlobalKPIs
const API_BASE = 'http://localhost:8000';

export const Dashboard: React.FC = () => {
  const [clientesData,       setClientesData]       = useState<any[]>([]);
  const [conversacionesData, setConversacionesData] = useState<any[]>([]);
  const [transaccionesData,  setTransaccionesData]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [clientesRes, convRes, txsRes] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/clientes-churn`),
          fetch(`${API_BASE}/api/dashboard/conversaciones-motivos`),
          fetch(`${API_BASE}/api/dashboard/transacciones-mensuales`),
        ]);

        const clientesJson = clientesRes.ok ? await clientesRes.json() : [];
        console.log('DATOS RECIBIDOS CHURN:', clientesJson);
        const convJson = convRes.ok ? await convRes.json() : [];
        const txsJson  = txsRes.ok  ? await txsRes.json()  : [];

        setClientesData(clientesJson);
        setConversacionesData(convJson);
        setTransaccionesData(txsJson);
      } catch (err) {
        console.error('Error de conexión:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const motivosKeys = conversacionesData.length > 0
    ? Object.keys(conversacionesData[0]).filter(k => k !== 'mes')
    : [];
  const motifColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  // ── Tooltips ──────────────────────────────────────────────────────────────

  const CustomTooltipBar = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl border border-slate-700">
        {payload[0].payload.status}:{' '}
        <span className="text-indigo-400">{payload[0].value.toLocaleString()}</span>
      </div>
    );
  };

  const CustomTooltipConv = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xl text-[10px] z-50">
        <p className="font-black text-slate-800 mb-1 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-bold flex justify-between gap-4 mt-0.5">
            <span>{entry.name}:</span> <span>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const CustomTooltipDetalleTx = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const detalles = payload.filter((p: any) => p.dataKey !== 'total');
    const total    = payload.find((p: any)  => p.dataKey === 'total')?.value;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xl text-[10px]">
        <p className="font-black text-slate-800 mb-2 border-b pb-1">{label}</p>
        <p className="text-indigo-600 font-bold mb-2">Total: ${total?.toFixed(2)}M</p>
        <div className="space-y-1">
          {detalles.map((d: any, i: number) => (
            <div key={i} className="flex justify-between gap-4 text-slate-500">
              <span className="font-medium">{d.name}:</span>
              <span className="font-bold">${d.value.toFixed(2)}M</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-xs font-bold uppercase tracking-widest">Calculando datos desde Parquet...</span>
      </div>
    );
  }

  return (
    <div className="h-[90vh] flex flex-col space-y-4 animate-in fade-in duration-500 overflow-hidden pb-4">

      {/* ── Fila 1 ── */}
      <div className="flex gap-4 h-[45%] min-h-0">

        {/* Gráfica 1: Churn vs No Churn */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-4">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={16} /></div>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Análisis de Retención</h2>
          </div>
          {/* ✅ Altura fija en px — elimina el warning de Recharts */}
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clientesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltipBar />} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {clientesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'Churn' ? '#f43f5e' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Motivos por Mes */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-4">
          <div className="flex items-center gap-2 mb-2 shrink-0">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><MessageSquare size={16} /></div>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Motivos Principales x Mes</h2>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={conversacionesData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipConv />} cursor={{ fill: '#f8fafc' }} />
                {motivosKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={motifColors[index % motifColors.length]}
                    radius={index === motivosKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Fila 2: Transacciones ── */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-4 min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Activity size={16} /></div>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mensualidades Totales</h2>
          </div>
          <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Monto (M)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Volumen</span>
          </div>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={transaccionesData}>
              <defs>
                <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipDetalleTx />} />
              <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#colorMonto)" strokeWidth={3} />
              {Object.keys(transaccionesData[0] || {})
                .filter(k => k !== 'mes' && k !== 'total')
                .map(key => (
                  <Area key={key} type="monotone" dataKey={key} stroke="none" fill="none" />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;