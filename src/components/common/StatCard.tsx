// src/components/common/StatCard.tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode; // Ahora acepta el componente de Lucide directamente
  trend?: string;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  description 
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
      
      {(trend || description) && (
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
              {trend}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-400">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};