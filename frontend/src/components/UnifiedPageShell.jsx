import React from "react";
import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";

export default function UnifiedPageShell({
  children,
  rightContent,
  topActions,
  className = "",
  rightClassName = "",
  contentClassName = "",
  gridClassName = "",
}) {
  const hasRightContent = Boolean(rightContent);
  const gridLayoutClass = gridClassName || (hasRightContent ? "lg:grid-cols-[1.05fr_0.95fr]" : "lg:grid-cols-1");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.08),_transparent_28%),linear-gradient(180deg,_#fafcff_0%,_#eff6ff_100%)] text-slate-900">
      <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/20">
              <FiHome className="text-2xl" />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-[#1d4ed8]">FixItNow</span>
              <span className="block text-lg font-semibold text-slate-900">Neighborhood Services</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">{topActions}</div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className={`grid items-stretch gap-6 ${gridLayoutClass} ${contentClassName}`}>
          <section className={`rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] ${className}`}>
            {children}
          </section>

          {hasRightContent && (
            <aside className={`relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,_#1d4ed8_0%,_#0f766e_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] ${rightClassName}`}>
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-cyan-200/20 blur-3xl" />
              <div className="relative h-full">{rightContent}</div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}