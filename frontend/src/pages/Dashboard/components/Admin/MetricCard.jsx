import React from 'react';
import { motion } from 'framer-motion';

export default function MetricCard({ title, value, icon, color, compact = false }) {
  const getColorClasses = (color) => {
    const colorMap = {
      '#4F46E5': { bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', light: 'indigo-100' },
      '#06B6D4': { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200', light: 'cyan-100' },
      '#10B981': { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', light: 'emerald-100' },
      '#F59E0B': { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', light: 'amber-100' },
    };
    return colorMap[color] || { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', light: 'slate-100' };
  };

  const classes = getColorClasses(color);

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden border ${classes.border} bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition ${compact ? 'rounded-[1.25rem] p-4' : 'rounded-[1.75rem] p-6'}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${classes.bg}`} />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15" style={{ backgroundColor: color }} />

      <div className="relative z-10">
        <div className={`flex items-start justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
          <div className={`${compact ? 'rounded-xl p-2' : 'rounded-2xl p-3'}`} style={{ backgroundColor: `${color}14` }}>
            <div className={compact ? 'text-xl' : 'text-2xl'} style={{ color: color }}>
              {icon}
            </div>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className={compact ? 'space-y-1' : 'space-y-2'}>
          <p className={`${compact ? 'text-[11px]' : 'text-sm'} font-medium uppercase tracking-[0.18em] text-slate-400`}>{title}</p>
          <p className={`${compact ? 'text-3xl' : 'text-4xl'} font-semibold tracking-tight text-slate-900`}>{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

