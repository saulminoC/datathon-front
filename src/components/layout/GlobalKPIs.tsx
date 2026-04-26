import React, { useState, useEffect } from 'react';
import {
  DollarSign, MessageSquareText, UserMinus, Activity,
  TrendingUp, TrendingDown, Calendar, AlertCircle,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface KpiValue {
  valor: number;
  porcentaje: number;
  es_bueno: boolean;
}

interface KpisData {
  monto_total: KpiValue;
  num_inputs: KpiValue;
  nuevos_churns: KpiValue;
  num_transacciones: KpiValue; // ✅ Nuevo KPI de Diego
}

// ── Config ────────────────────────────────────────────────────────────────────

const API = 'http://localhost:8000';

const MESES_FALLBACK = ['2026-04','2026-03','2026-02','2026-01','2025-12'];

const formatearMes = (ym: string): string => {
  const [year, month] = ym.split('-');
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
};

const formatMonto = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`;

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  title: string;
  icon: React.ElementType;
  kpi: KpiValue;
  colorClass: string;
  formatValue?: (v: number) => string;
}

const Card: React.FC<CardProps> = ({ title, icon: Icon, kpi, colorClass, formatValue }) => (
  <div className="flex-1 flex items-center gap-3">
    <div className={`p-2 rounded-lg ${colorClass}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-black text-slate-900 tracking-tight leading-none">
          {formatValue ? formatValue(kpi.valor) : kpi.valor.toLocaleString('es-MX')}
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5
          ${kpi.es_bueno ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {kpi.porcentaje >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(kpi.porcentaje)}%
        </span>
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────

export const GlobalKPIs: React.FC = () => {
  const [meses, setMeses] = useState<string[]>([]);
  const [mes, setMes] = useState<string>('');
  const [data, setData] = useState<KpisData | null>(null);
  const [error, setError] = useState(false);
  const [loadingKpis, setLoadingKpis] = useState(false);

  // 1️⃣ Cargar lista de meses
  useEffect(() => {
    const fetchMeses = async () => {
      try {
        const res = await fetch(`${API}/api/dashboard/meses`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const lista: string[] = json.meses ?? [];
        if (lista.length === 0) throw new Error('Lista vacía');
        setMeses(lista);
        setMes(lista[0]);
      } catch (err) {
        console.warn('[GlobalKPIs] Fallback meses:', err);
        setMeses(MESES_FALLBACK);
        setMes(MESES_FALLBACK[0]);
      }
    };
    fetchMeses();
  }, []);

  // 2️⃣ Cargar KPIs cuando cambia el mes
  useEffect(() => {
    if (!mes) return;

    const fetchKPIs = async () => {
      try {
        setError(false);
        setLoadingKpis(true);
        const res = await fetch(`${API}/api/dashboard/global-kpis?mes_filtro=${mes}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: KpisData = await res.json();
        setData(json);
      } catch (err) {
        console.error('[GlobalKPIs] Error:', err);
        setError(true);
      } finally {
        setLoadingKpis(false);
      }
    };

    fetchKPIs();
  }, [mes]);

  if (!mes) {
    return <div className="h-20 bg-slate-100 animate-pulse rounded-xl mb-6" />;
  }

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 flex items-center gap-4">

      {/* Selector de mes */}
      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border shrink-0">
        <Calendar size={14} className="text-slate-400" />
        <select
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
        >
          {meses.map(m => (
            <option key={m} value={m}>{formatearMes(m)}</option>
          ))}
        </select>
      </div>

      {/* Error View */}
      {error && (
        <div className="flex-1 flex items-center gap-2 text-rose-600 text-xs font-bold">
          <AlertCircle size={14} /> Error al conectar con la API de KPIs
        </div>
      )}

      {/* Skeleton Loading */}
      {loadingKpis && !error && (
        <div className="flex-1 flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1 h-10 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* KPI Cards (4 Columnas) */}
      {!loadingKpis && !error && data && (
        <>
          <Card
            title="Flujo Mensual"
            icon={DollarSign}
            kpi={data.monto_total}
            colorClass="bg-indigo-50 text-indigo-600"
            formatValue={formatMonto}
          />
          <Card
            title="Uso Chatbot"
            icon={MessageSquareText}
            kpi={data.num_inputs}
            colorClass="bg-indigo-50 text-indigo-600"
          />
          <Card
            title="Transacciones"
            icon={Activity}
            kpi={data.num_transacciones}
            colorClass="bg-indigo-50 text-indigo-600"
          />
          <Card
            title="Nuevos Churns"
            icon={UserMinus}
            kpi={data.nuevos_churns}
            colorClass="bg-rose-50 text-rose-600"
          />
        </>
      )}
    </div>
  );
};

export default GlobalKPIs;