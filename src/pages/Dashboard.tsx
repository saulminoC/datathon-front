import React, { useState, useEffect } from 'react';
import {
  Users,
  Target,
  AlertCircle,
  Activity,
  TrendingDown,
  MessageSquare,
  DollarSign,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { MapaMexico } from './MapaMexico';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface RiesgoItem {
  name: string;
  value: number;
  pct: number;
  color: string;
}

interface TxMensual {
  mes: string;
  txs: number;
  monto: number;
}

interface RiesgoEstado {
  estado: string;
  pct: number;
  total: number;
}

interface SatisfaccionItem {
  score: string;
  count: number;
}

interface KPIs {
  totalClientes: string;
  riesgoAlto: number;
  riesgoMedio: number;
  riesgoBajo: number;
  precision: number;
  satisfaccionProm: number;
}

interface SatPorRiesgo {
  riesgo: string;
  dias_login_prom: number;
  satisfaccion_prom: number;
  ingreso_prom: number;
  total: number;
}

interface TemaChurn {
  tema: string;
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMes(mesStr: string): string {
  const parts = mesStr.split('-');
  return MES_LABELS[parts[1]] ?? mesStr;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const CustomTooltipTx = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-indigo-600">{payload[0]?.value?.toLocaleString('es-MX')} txs</p>
      <p className="text-slate-400">${payload[1]?.value?.toFixed(1)}M MXN</p>
    </div>
  );
};

const CustomTooltipIngreso = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">Riesgo {label}</p>
      <p style={{ color: payload[0]?.fill }}>
        Ingreso prom: ${payload[0]?.value?.toLocaleString('es-MX')} MXN
      </p>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  // ── Estado de datos dinámicos ──
  const [riesgoData, setRiesgoData]               = useState<RiesgoItem[]>([]);
  const [txMensual, setTxMensual]                 = useState<TxMensual[]>([]);
  const [riesgoEstado, setRiesgoEstado]           = useState<RiesgoEstado[]>([]);
  const [satisfaccionData, setSatisfaccionData]   = useState<SatisfaccionItem[]>([]);
  const [satPorRiesgo, setSatPorRiesgo]           = useState<SatPorRiesgo[]>([]);
  const [temasChurn, setTemasChurn]               = useState<TemaChurn[]>([]);
  const [kpis, setKpis] = useState<KPIs>({
    totalClientes: '—',
    riesgoAlto:    0,
    riesgoMedio:   0,
    riesgoBajo:    0,
    precision:     94.2,
    satisfaccionProm: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  // ── Carga inicial ──
  useEffect(() => {
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const [
          kpisRes,
          riesgoDistRes,
          txMensualRes,
          riesgoEstadoRes,
          satisfaccionRes,
          satRiesgoRes,
          temasRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/kpis`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/riesgo-distribucion`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/transacciones-mensuales`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/riesgo-por-estado?top=8`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/satisfaccion`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/satisfaccion-por-riesgo`).then((r) => r.json()),
          fetch(`${API_BASE}/api/dashboard/temas-conversaciones?riesgo=Alto`).then((r) => r.json()),
        ]);

        // KPIs
        setKpis({
          totalClientes:    kpisRes.total_clientes.toLocaleString('es-MX'),
          riesgoAlto:       kpisRes.riesgo_alto,
          riesgoMedio:      kpisRes.riesgo_medio,
          riesgoBajo:       kpisRes.riesgo_bajo,
          precision:        94.2,
          satisfaccionProm: kpisRes.satisfaccion_prom,
        });

        // Distribución de riesgo
        const riesgoMapped: RiesgoItem[] = (riesgoDistRes as any[]).map((d) => ({
          name:  d.riesgo,
          value: d.count,
          pct:   d.pct,
          color: RIESGO_COLORS[d.riesgo] ?? '#94a3b8',
        }));
        setRiesgoData(riesgoMapped);

        // Transacciones mensuales
        const txMapped: TxMensual[] = (txMensualRes as any[]).map((d) => ({
          mes:   formatMes(d.mes),
          txs:   d.count,
          monto: Math.round((d.monto / 1_000_000) * 10) / 10,
        }));
        setTxMensual(txMapped);

        // Riesgo por estado
        const estadoMapped: RiesgoEstado[] = (riesgoEstadoRes as any[]).map((d) => ({
          estado: d.estado,
          pct:    d.pct_alto,
          total:  d.total,
        }));
        setRiesgoEstado(estadoMapped);

        // Satisfacción
        setSatisfaccionData(
          (satisfaccionRes as any[]).map((d) => ({
            score: String(d.score),
            count: d.count,
          }))
        );

        // Satisfacción + ingreso por riesgo
        setSatPorRiesgo(satRiesgoRes as SatPorRiesgo[]);

        // Temas de conversaciones
        setTemasChurn(temasRes as TemaChurn[]);

      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAll();
  }, []);

  // ── Helpers UI ──
  const diasPorSegmento = (segmento: string) => {
    const found = satPorRiesgo.find((s) => s.riesgo === segmento);
    return found ? `${Math.round(found.dias_login_prom)} días` : '—';
  };

  const totalTxs   = txMensual.reduce((acc, d) => acc + d.txs, 0);
  const totalMonto = txMensual.reduce((acc, d) => acc + d.monto, 0);

  // Datos derivados para gráficas nuevas
  const churnVsNoChurn = [
    { name: 'No Churn', value: kpis.riesgoBajo,  color: '#10b981' },
    { name: 'Riesgo Medio', value: kpis.riesgoMedio, color: '#f59e0b' },
    { name: 'Churn Alto',   value: kpis.riesgoAlto,  color: '#f43f5e' },
  ];

  const ingresoSegmento = satPorRiesgo
    .filter((s) => ['Bajo', 'Medio', 'Alto'].includes(s.riesgo))
    .map((s) => ({
      riesgo:  s.riesgo,
      ingreso: Math.round(s.ingreso_prom),
      color:   RIESGO_COLORS[s.riesgo] ?? '#94a3b8',
    }));

  const maxTema = Math.max(...temasChurn.map((t) => t.count), 1);

  const TEMA_COLORS = ['#6366f1','#f43f5e','#f59e0b','#10b981','#8b5cf6','#06b6d4','#ec4899'];

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">

      {/* ── Encabezado ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
        <div>
          {/*<h1 className="text-2xl font-bold text-slate-900">Havi Insights Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Vista global de retención · {loadingData ? '…' : `${kpis.totalClientes} clientes evaluados`}
          </p>*/}
        </div>
      </div>

      {/* ── KPIs (Tarjetas más chicas, sin trend, grid más compacto) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Base Evaluada"
          value={loadingData ? '…' : kpis.totalClientes}
          icon={<Users className="text-indigo-600" size={18} />}
        />
        <StatCard
          title="Riesgo Alto"
          value={loadingData ? '…' : kpis.riesgoAlto.toLocaleString('es-MX')}
          icon={<AlertCircle className="text-rose-500" size={18} />}
        />
        <StatCard
          title="Riesgo Medio"
          value={loadingData ? '…' : kpis.riesgoMedio.toLocaleString('es-MX')}
          icon={<TrendingDown className="text-amber-500" size={18} />}
        />
        <StatCard
          title="Precisión del Motor"
          value={`${kpis.precision}%`}
          icon={<Target className="text-emerald-600" size={18} />}
        />
      </div>

      {/* ── Fila 1: Donut riesgo + Transacciones mensuales ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Donut distribución de riesgo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Distribución de Riesgo</h2>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={riesgoData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={64}
                paddingAngle={3}
                dataKey="value"
              >
                {riesgoData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {riesgoData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-slate-500">{d.name} riesgo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                    {d.value.toLocaleString('es-MX')}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transacciones mensuales */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Actividad Transaccional 2025</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loadingData
                  ? '…'
                  : `${totalTxs.toLocaleString('es-MX')} txs · $${totalMonto.toFixed(0)}M MXN`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-6 h-0.5 bg-indigo-500 inline-block rounded" />Transacciones
              </span>
              <span className="flex items-center gap-1">
                <span className="w-6 h-0.5 bg-emerald-400 inline-block rounded" />Monto (M MXN)
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={txMensual} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMonto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}M`} />
              <Tooltip content={<CustomTooltipTx />} />
              <Area yAxisId="left" type="monotone" dataKey="txs" stroke="#6366f1" strokeWidth={2} fill="url(#gradTx)" dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="monto" stroke="#10b981" strokeWidth={2} fill="url(#gradMonto)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Fila 2: Churn vs No Churn + Motivos de Churn + Ingreso por segmento ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Churn vs No Churn */}
        {/*<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-800">Volumen de Fuga</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">Distribución por segmento de riesgo</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={churnVsNoChurn}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barSize={42}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString('es-MX') + ' clientes', 'Clientes']}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {churnVsNoChurn.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-1 mt-2 pt-3 border-t border-slate-100">
            {churnVsNoChurn.map((d) => (
              <div key={d.name} className="text-center">
                <p className="text-sm font-bold tabular-nums" style={{ color: d.color }}>
                  {(d.value / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">{d.name}</p>
              </div>
            ))}
          </div>
        </div>*/}

        {/* Motivos principales de Churn */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-800">Motivos principales de Churn</h2>
            <MessageSquare size={14} className="text-slate-300" />
          </div>
          <p className="text-xs text-slate-400 mb-4">NLP en segmento de riesgo alto</p>

          {loadingData ? (
            <div className="flex items-center justify-center h-32 text-slate-300 text-sm">Cargando…</div>
          ) : temasChurn.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-300 text-sm">Sin datos</div>
          ) : (
            <div className="space-y-3.5">
              {temasChurn.slice(0, 7).map((t, i) => {
                const pct = Math.round((t.count / maxTema) * 100);
                return (
                  <div key={t.tema} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 flex-shrink-0 truncate">{t.tema}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: TEMA_COLORS[i % TEMA_COLORS.length] }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-10 text-right tabular-nums">
                      {t.count.toLocaleString('es-MX')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ingreso promedio por segmento */}
        {/*<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-800">Ingreso Mensual</h2>
            <DollarSign size={14} className="text-slate-300" />
          </div>
          <p className="text-xs text-slate-400 mb-3">Promedio MXN · por nivel de riesgo</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={ingresoSegmento}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              barSize={44}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="riesgo"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltipIngreso />} />
              <Bar dataKey="ingreso" radius={[4, 4, 0, 0]}>
                {ingresoSegmento.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-1 mt-2 pt-3 border-t border-slate-100">
            {ingresoSegmento.map((d) => (
              <div key={d.riesgo} className="text-center">
                <p className="text-sm font-bold tabular-nums" style={{ color: d.color }}>
                  ${(d.ingreso / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">{d.riesgo}</p>
              </div>
            ))}
          </div>
        </div>*/}
      </div>

      {/* ── Fila 3: Mapa Geográfico + Satisfacción ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Riesgo por estado + Mapa Geográfico */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Mapa de Fuga por Estado</h2>
              <p className="text-xs text-slate-400 mt-0.5">Concentración de riesgo a nivel nacional</p>
            </div>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
              Escala: Blanco (Bajo) a Negro (Alto)
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            
            {/* Contenedor del Mapa (Izquierda) */}
            <div className="w-full md:w-1/2 h-64 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 relative group">
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-bold text-slate-500 px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                Pasa el cursor para inspeccionar
              </div>
              <MapaMexico datos={riesgoEstado} />
            </div>

            {/* Barras de progreso (Derecha) */}
            <div className="w-full md:w-1/2 space-y-3">
              {riesgoEstado.map((d) => {
                const maxPct = Math.max(...riesgoEstado.map((e) => e.pct), 1);
                return (
                  <div key={d.estado} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 w-28 flex-shrink-0">{d.estado}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(d.pct / maxPct) * 100}%`,
                          background:
                            d.pct >= 14 ? '#0f172a' // Negro
                            : d.pct >= 12 ? '#334155'
                            : d.pct >= 10 ? '#64748b'
                            : '#94a3b8',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-8 text-right tabular-nums">{d.pct}%</span>
                    <span className="text-[10px] text-slate-400 w-12 text-right tabular-nums">{d.total.toLocaleString('es-MX')}</span>
                  </div>
                );
              })}
              
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100 text-[10px] font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block" /> Crítico (&gt;14%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" /> Alto (12-14%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" /> Medio (10-12%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;