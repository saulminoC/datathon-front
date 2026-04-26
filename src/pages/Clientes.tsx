import React, { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import {
  ScatterChart, Scatter, ZAxis, Legend,
  XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Package, MapPin, BarChart2, Users, TrendingDown, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const MEX_TOPO = 'https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json';

const churnPalette = (pct: number) => {
  if (pct >= 55) return { bg: '#fca5a5', text: '#991b1b', fill: '#ef4444' };
  if (pct >= 40) return { bg: '#fed7aa', text: '#9a3412', fill: '#f97316' };
  if (pct >= 25) return { bg: '#fde68a', text: '#92400e', fill: '#f59e0b' };
  return          { bg: '#bbf7d0', text: '#14532d', fill: '#22c55e' };
};

interface ProductoRow  { producto: string; usos: number; churn_pct: number; }
interface EstadoData   { clientes: number; churn_pct: number; nombre: string; }
interface TooltipState { x: number; y: number; nombre: string; clientes: number; churn_pct: number; }

const MOCK_PRODUCTOS: ProductoRow[] = [
  { producto: 'Tarjeta Débito Hey',   usos: 5820, churn_pct: 24 },
  { producto: 'Transferencia SPEI',   usos: 4310, churn_pct: 38 },
  { producto: 'Hey Pro Suscripción',  usos: 2940, churn_pct: 16 },
  { producto: 'Crédito Personal',     usos: 1870, churn_pct: 57 },
  { producto: 'Inversión Automática', usos: 1240, churn_pct: 19 },
  { producto: 'Seguro Viaje',         usos:  680, churn_pct: 44 },
];

const MOCK_ESTADOS: Record<string, EstadoData> = {
  'Jalisco':          { clientes: 2140, churn_pct: 38, nombre: 'Jalisco' },
  'Nuevo León':       { clientes: 1980, churn_pct: 29, nombre: 'Nuevo León' },
  'Distrito Federal': { clientes: 3210, churn_pct: 42, nombre: 'CDMX' },
  'Puebla':           { clientes: 1420, churn_pct: 55, nombre: 'Puebla' },
};

// Tooltip interactivo para el Scatter Plot
const ScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-2xl text-[11px] text-white">
      <p className="font-black mb-1 text-slate-300">Perfil de Cliente</p>
      <p><span className="text-slate-400">Edad:</span> {data.edad} años</p>
      <p><span className="text-slate-400">Ingreso:</span> ${(data.ingreso).toLocaleString()} MXN</p>
      <p className={`font-bold mt-1 ${data.status === 'CHURN' ? 'text-rose-500' : 'text-emerald-500'}`}>
        {data.status}
      </p>
    </div>
  );
};

export const Clientes: React.FC = () => {
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [estadoMap, setEstadoMap] = useState<Record<string, EstadoData>>({});
  const [scatterData, setScatterData] = useState<any[]>([]);
  const [tooltip,   setTooltip]   = useState<TooltipState | null>(null);
  const [loading,   setLoading]   = useState({ prods: true, mapa: true, scatter: true });

  useEffect(() => {
    fetch(`${API_BASE}/api/clientes/productos-mas-utilizados`)
      .then(r => r.json()).then(d => setProductos(d.data || MOCK_PRODUCTOS))
      .catch(() => setProductos(MOCK_PRODUCTOS))
      .finally(() => setLoading(p => ({ ...p, prods: false })));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/clientes/mapa-estados`)
      .then(r => r.json())
      .then(d => {
        const m: Record<string, EstadoData> = {};
        (d.data || []).forEach((x: any) => { m[x.nombre] = x; });
        setEstadoMap(Object.keys(m).length ? m : MOCK_ESTADOS);
      })
      .catch(() => setEstadoMap(MOCK_ESTADOS))
      .finally(() => setLoading(p => ({ ...p, mapa: false })));
  }, []);

  useEffect(() => {
    // CAMBIO CLAVE AQUÍ: Ajustamos la URL a /api/reim/scatter-edad-ingreso
    fetch(`${API_BASE}/api/reim/scatter-edad-ingreso`)
      .then(r => {
        if (!r.ok) throw new Error("Error en la red");
        return r.json();
      })
      .then(d => setScatterData(d || []))
      .catch(e => console.error("Error cargando scatter:", e))
      .finally(() => setLoading(p => ({ ...p, scatter: false })));
  }, []);

  const maxUsos = Math.max(...productos.map(p => p.usos), 1);

  const handleGeoMove = useCallback((geo: any, evt: React.MouseEvent) => {
    const nombre = geo.properties?.name || geo.properties?.NAME || geo.properties?.name_1 || geo.properties?.nombre || '';
    const data = estadoMap[nombre] || null;
    if (!data) { setTooltip(null); return; }
    const container = (evt.currentTarget as HTMLElement).closest('#mapa-wrapper');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
      nombre: data.nombre || nombre,
      clientes: data.clientes,
      churn_pct: data.churn_pct,
    });
  }, [estadoMap]);

  const geoFill = (geo: any) => {
    const nombre = geo.properties?.name || geo.properties?.NAME || geo.properties?.name_1 || geo.properties?.nombre || '';
    const data = estadoMap[nombre];
    if (!data) return '#e2e8f0';
    return churnPalette(data.churn_pct).fill;
  };

  // Separar datos para pintarlos de dos colores en la gráfica
  const dataChurn = scatterData.filter(d => d.status === 'CHURN');
  const dataNoChurn = scatterData.filter(d => d.status === 'NO CHURN');

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden pb-2 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Análisis de Clientes</h1>
          <p className="text-xs text-slate-400 mt-0.5">Productos · Distribución geográfica · Perfil de riesgo por edad</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Crítico ≥55%', fill: '#ef4444', bg: '#fca5a5' },
            { label: 'Alto 40–55%',  fill: '#f97316', bg: '#fed7aa' },
            { label: 'Medio 25–40%', fill: '#f59e0b', bg: '#fde68a' },
            { label: 'Bajo <25%',    fill: '#22c55e', bg: '#bbf7d0' },
          ].map(c => (
            <span
              key={c.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider"
              style={{ background: c.bg, color: c.fill }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: c.fill }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Fila principal */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Columna izquierda (KPIs y Productos) */}
        <div className="w-[300px] shrink-0 flex flex-col gap-3">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[
              { icon: <Users size={13}/>,       label: 'Clientes',    value: '13,860', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: <TrendingDown size={13}/>, label: 'Churn Prom.', value: '38.4%',  color: 'text-rose-600',   bg: 'bg-rose-50'   },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 shadow-sm">
                <div className={`p-1.5 rounded-lg ${k.bg} ${k.color}`}>{k.icon}</div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                  <p className={`text-sm font-black ${k.color}`}>{k.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Productos */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60 shrink-0">
              <Package size={12} className="text-indigo-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Productos Más Utilizados</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading.prods
                ? Array(5).fill(0).map((_, i) => (
                    <div key={i} className="px-4 py-3.5 border-b border-slate-50">
                      <div className="h-2.5 bg-slate-100 animate-pulse rounded mb-2 w-4/5" />
                      <div className="h-1.5 bg-slate-100 animate-pulse rounded w-3/4" />
                    </div>
                  ))
                : productos.map((p, i) => {
                    const pal = churnPalette(p.churn_pct);
                    return (
                      <div key={i} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-300 w-4">#{i + 1}</span>
                            <span className="text-[11px] font-bold text-slate-700">{p.producto}</span>
                          </div>
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: pal.bg, color: pal.text }}
                          >
                            {p.churn_pct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(p.usos / maxUsos) * 100}%`, background: pal.fill }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">
                            {p.usos.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60 shrink-0">
            <MapPin size={12} className="text-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Distribución por Estado — Hover para detalles
            </span>
          </div>
          <div className="flex-1 relative overflow-hidden" id="mapa-wrapper">
            {loading.mapa ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[11px] text-slate-300 animate-pulse font-bold tracking-widest uppercase">Cargando mapa...</p>
              </div>
            ) : (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ center: [-102, 24], scale: 1050 }}
                style={{ width: '100%', height: '100%' }}
              >
                <ZoomableGroup zoom={1}>
                  <Geographies geography={MEX_TOPO}>
                    {({ geographies }) =>
                      geographies.map(geo => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={geoFill(geo)}
                          stroke="#ffffff"
                          strokeWidth={0.8}
                          style={{
                            default: { outline: 'none', transition: 'fill 0.15s, opacity 0.15s' },
                            hover:   { outline: 'none', fill: '#4f46e5', opacity: 0.9, cursor: 'pointer' },
                            pressed: { outline: 'none' },
                          }}
                          onMouseMove={(evt: any) => handleGeoMove(geo, evt)}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      ))
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            )}

            {tooltip && (
              <div
                className="absolute z-50 pointer-events-none"
                style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
              >
                <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 border border-slate-700 min-w-[160px]">
                  <p className="font-black text-white text-[12px] mb-2">{tooltip.nombre}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-8 text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users size={9}/> Clientes
                      </span>
                      <span className="font-bold">{tooltip.clientes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-8 text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <AlertTriangle size={9}/> Churn
                      </span>
                      <span className="font-black" style={{ color: churnPalette(tooltip.churn_pct).fill }}>
                        {tooltip.churn_pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fila inferior: Gráfico de Dispersión (Scatter Plot Interactivo) */}
      <div className="h-[280px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden mb-4">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 size={12} className="text-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Relación entre Edad e Ingreso Mensual vs. Churn
            </span>
          </div>
          {loading.scatter && (
            <span className="text-[9px] font-bold text-indigo-400 animate-pulse uppercase tracking-wider">
              Cargando muestra de datos...
            </span>
          )}
        </div>
        <div className="flex-1 p-4 min-h-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              
              <XAxis 
                type="number" 
                dataKey="edad" 
                name="Edad" 
                domain={['dataMin - 2', 'dataMax + 2']} 
                style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 700 }} 
                tickLine={false} 
                axisLine={false} 
              />
              
              <YAxis 
                type="number" 
                dataKey="ingreso" 
                name="Ingreso" 
                style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 700 }} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(v) => `$${v/1000}k`} 
              />
              
              {/* ZAxis simula el tamaño s=40 que querían en Python */}
              <ZAxis type="number" range={[40, 40]} />
              
              <ReTooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
              
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} verticalAlign="top" height={24} />
              
              <Scatter name="NO CHURN" data={dataNoChurn} fill="#22c55e" fillOpacity={0.6} />
              <Scatter name="CHURN" data={dataChurn} fill="#ef4444" fillOpacity={0.6} />
              
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Clientes;