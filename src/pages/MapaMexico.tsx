import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = "https://code.highcharts.com/mapdata/countries/mx/mx-all.topo.json";

interface MapaProps {
  datos: { estado: string; pct: number; total: number }[];
}

export const MapaMexico: React.FC<MapaProps> = ({ datos }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: any } | null>(null);

  const getEstadoData = (estadoMapa: string) => {
    if (!estadoMapa) return null;
    const estadoLimpio = estadoMapa.toLowerCase();
    
    return datos.find(d => {
      const dbEstado = d.estado.toLowerCase();
      if (dbEstado.includes('cdmx') && (estadoLimpio.includes('distrito') || estadoLimpio.includes('ciudad de'))) return true;
      if (dbEstado.includes('estado de méxico') && estadoLimpio === 'méxico') return true;
      return dbEstado.includes(estadoLimpio) || estadoLimpio.includes(dbEstado);
    });
  };

  const getColor = (item: any) => {
    if (!item) return "#f8fafc"; 
    const pct = item.pct;
    if (pct >= 14) return "#0f172a";
    if (pct >= 12) return "#334155";
    if (pct >= 10) return "#64748b";
    if (pct >= 8)  return "#94a3b8";
    return "#e2e8f0";
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Tooltip Flotante */}
      {tooltip && (
        <div
          className="absolute z-50 bg-slate-900/95 backdrop-blur text-white text-xs rounded-xl px-4 py-3 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          <p className="font-black text-sm mb-2 border-b border-slate-700 pb-1">{tooltip.content.nombre}</p>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Usuarios:</span>
            <span className="font-bold text-indigo-400">{tooltip.content.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 mt-1">
            <span className="text-slate-400">Riesgo Churn:</span>
            <span className="font-black text-rose-400">{tooltip.content.pct}%</span>
          </div>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1300, center: [-102, 24] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const estadoNombre = geo.properties.name || geo.properties.NAME_1 || "";
              const item = getEstadoData(estadoNombre);
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(item)}
                  stroke="#000000"
                  strokeWidth={1}
                  onMouseEnter={(e) => {
                    if (item) {
                      setTooltip({
                        x: e.nativeEvent.offsetX,
                        y: e.nativeEvent.offsetY,
                        content: { nombre: item.estado, pct: item.pct, total: item.total }
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (item) {
                      setTooltip({
                        x: e.nativeEvent.offsetX,
                        y: e.nativeEvent.offsetY,
                        content: { nombre: item.estado, pct: item.pct, total: item.total }
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#6366f1", outline: "none", transition: "all 250ms cursor-pointer" }, 
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};