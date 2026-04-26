import React, { useState, useEffect } from 'react';
import {
  Users,
  Target,
  AlertCircle,
  TrendingDown,
  MessageSquare,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { MapaMexico } from './MapaMexico';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

// ─── Constantes ───────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

const RIESGO_COLORS: Record<string, string> = {
  Bajo:  '#10b981',
  Medio: '#f59e0b',
  Alto:  '#f43f5e',
};

const MES_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

const TEMA_COLORS = ['#6366f1','#f43f5e','#f59e0b','#10b981','#8b5cf6']; // Solo 5 colores necesarios ahora

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface RiesgoItem { name: string; value: number; pct: number; color: string; }
interface TxMensual { mes: string; txs: number; monto: number; }
interface RiesgoEstado { estado: string; pct: number; total: number; }
interface KPIs { totalClientes: string; riesgoAlto: number; riesgoMedio: number; precision: number; }
interface TemaChurn { tema: string; count: number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatMes(mesStr: string): string {
  const parts = mesStr.split('-');
  return MES_LABELS[parts[1]] ?? mesStr;
}

const CustomTooltipTx = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-lg text-[10px] z-50">
      <p className="font-bold text-slate-700 mb-0.5">{label}</p>
      <p className="text-indigo-600 leading-tight">{payload[0]?.value?.toLocaleString('es-MX')} txs</p>
      <p className="text-slate-500 leading-tight">${payload[1]?.value?.toFixed(1)}M MXN</p>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [riesgoData, setRiesgoData]     = useState<RiesgoItem[]>([]);
  const [txMensual, setTxMensual]       = useState<TxMensual[]>([]);
  const [riesgoEstado, setRiesgoEstado] = useState<RiesgoEstado[]>([]);
  const [temasChurn, setTemasChurn]     = useState<TemaChurn[]>([]);
  const [kpis, setKpis] = useState<KPIs>({
    totalClientes: '—',
    riesgoAlto:    0,
    riesgoMedio:   0,
    precision:     94.2,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const [
          kpisRes,
          riesgoDistRes,
          txMensualRes,
          riesgoEstadoRes,
          temasRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/kpis`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/riesgo-distribucion`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/transacciones-mensuales`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/riesgo-por-estado?top=8`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/temas-conversaciones?riesgo=Alto`).then((r) => r.json()),
        ]);

        setKpis({
          totalClientes: kpisRes.total_clientes.toLocaleString('es-MX'),
          riesgoAlto:    kpisRes.riesgo_alto,
          riesgoMedio:   kpisRes.riesgo_medio,
          precision:     94.2,
        });

        setRiesgoData((riesgoDistRes as any[]).map((d) => ({
          name:  d.riesgo,
          value: d.count,
          pct:   d.pct,
          color: RIESGO_COLORS[d.riesgo] ?? '#94a3b8',
        })));

        setTxMensual((txMensualRes as any[]).map((d) => ({
          mes:   formatMes(d.mes),
          txs:   d.count,
          monto: Math.round((d.monto / 1_000_000) * 10) / 10,
        })));

        setRiesgoEstado((riesgoEstadoRes as any[]).map((d) => ({
          estado: d.estado,
          pct:    d.pct_alto,
          total:  d.total,
        })));

        setTemasChurn(temasRes as TemaChurn[]);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, []);

  const totalTxs   = txMensual.reduce((acc, d) => acc + d.txs, 0);
  const totalMonto = txMensual.reduce((acc, d) => acc + d.monto, 0);
  const maxTema    = Math.max(...temasChurn.map((t) => t.count), 1);

  return (
    // Redujimos los espacios globales (space-y-3 y pb-2 en lugar de pb-10)
    <div className="space-y-3 animate-in fade-in duration-500 pb-2">
      
      {/* ── Encabezado ultra-compacto ── */}
      {/*<div className="mb-1">
        <h1 className="text-xl font-bold text-slate-900 leading-none">Havi Insights Analytics</h1>
        <p className="text-[11px] text-slate-500 mt-1">
          Vista Ejecutiva Global · {loadingData ? '…' : `${kpis.totalClientes} clientes evaluados`}
        </p>
      </div>*/}

      {/* ── KPIs (Mismo Grid, pero asumiendo que StatCard es responsivo) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Base Evaluada" value={loadingData ? '…' : kpis.totalClientes} icon={<Users className="text-indigo-600" size={16} />} />
        <StatCard title="Riesgo Alto" value={loadingData ? '…' : kpis.riesgoAlto.toLocaleString('es-MX')} icon={<AlertCircle className="text-rose-500" size={16} />} />
        <StatCard title="Riesgo Medio" value={loadingData ? '…' : kpis.riesgoMedio.toLocaleString('es-MX')} icon={<TrendingDown className="text-amber-500" size={16} />} />
        <StatCard title="Precisión de IA" value={`${kpis.precision}%`} icon={<Target className="text-emerald-600" size={16} />} />
      </div>

      {/* ── Fila 1: Distribución (1 col) + Transacciones (2 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Distribución */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col justify-between col-span-1">
          <div className="mb-1">
            <h2 className="text-[13px] font-bold text-slate-800 leading-tight">Distribución de Riesgo</h2>
          </div>
          {/* Gráfica reducida en altura */}
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={riesgoData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                {riesgoData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around items-center pt-2 border-t border-slate-100">
            {riesgoData.map((d) => (
              <div key={d.name} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-[9px] uppercase font-bold text-slate-500">{d.name}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 tabular-nums">{d.pct}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transacciones */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col justify-between lg:col-span-2">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[13px] font-bold text-slate-800 leading-tight">Actividad Transaccional</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {loadingData ? '…' : `${totalTxs.toLocaleString('es-MX')} txs · $${totalMonto.toFixed(0)}M MXN`}
              </p>
            </div>
            <div className="flex flex-col items-end text-[9px] font-medium text-slate-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-sm" />Volumen</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-sm" />Monto</span>
            </div>
          </div>
          {/* Gráfica de área reducida a 140px */}
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={txMensual} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                <linearGradient id="gradMonto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}M`} />
              <Tooltip content={<CustomTooltipTx />} />
              <Area yAxisId="left" type="monotone" dataKey="txs" stroke="#6366f1" strokeWidth={2} fill="url(#gradTx)" dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="monto" stroke="#10b981" strokeWidth={2} fill="url(#gradMonto)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Fila 2: Motivos de Churn (1 col) + Mapa (2 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Motivos principales de Churn */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[13px] font-bold text-slate-800 leading-tight">Fricciones (NLP)</h2>
            </div>
            <MessageSquare size={12} className="text-indigo-400" />
          </div>

          {loadingData ? (
            <div className="flex-1 flex items-center justify-center text-slate-300 text-xs">Cargando...</div>
          ) : temasChurn.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-300 text-xs">Sin datos</div>
          ) : (
            // Reducido a solo 5 items y menor espaciado (space-y-2)
            <div className="flex-1 flex flex-col justify-between space-y-2">
              {temasChurn.slice(0, 5).map((t, i) => {
                const pct = Math.round((t.count / maxTema) * 100);
                return (
                  <div key={t.tema} className="flex items-center gap-2 w-full">
                    <span className="text-[10px] font-medium text-slate-600 w-20 flex-shrink-0 truncate text-right">
                      {t.tema}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, background: TEMA_COLORS[i % TEMA_COLORS.length] }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 w-8 tabular-nums text-right">
                      {t.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mapa Geográfico */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col justify-between lg:col-span-2">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[13px] font-bold text-slate-800 leading-tight">Concentración de Fuga</h2>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-900" /> Crítico</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-700" /> Alto</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-400" /> Medio</span>
            </div>
          </div>

          {/* Altura del mapa drásticamente reducida a 180px */}
          <div className="h-[180px] w-full rounded-lg overflow-hidden relative bg-slate-50/50 mt-1">
             <MapaMexico datos={riesgoEstado} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;