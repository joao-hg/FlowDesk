export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-slate-400 mt-1">Acompanhe as métricas e o volume de solicitações do FlowDesk.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-slate-800 text-sm font-medium text-slate-300 rounded-md border border-slate-700 hover:bg-slate-700 transition-colors">
            Últimos 7 dias
          </button>
          <button className="px-3 py-1.5 bg-slate-800 text-sm font-medium text-slate-300 rounded-md border border-slate-700 hover:bg-slate-700 transition-colors">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Solicitações abertas</h3>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-4">1.284</p>
          <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +12% <span className="text-slate-500 ml-1">vs mês anterior</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Dentro do SLA</h3>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-4">94,7%</p>
          <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +2.1% <span className="text-slate-500 ml-1">vs mês anterior</span>
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Em atraso</h3>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-4">17</p>
          <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            -5 <span className="text-slate-500 ml-1">vs mês anterior</span>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Concluídas no mês</h3>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-white mt-4">86%</p>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-slate-500">Média de 4.2 dias por ticket</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Volume de Solicitações (Semanal)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {/* Gráfico de barras simples com divs para MVP */}
            {[60, 80, 45, 90, 110, 75, 40].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-indigo-500/20 rounded-t-sm hover:bg-indigo-500/40 transition-colors relative group cursor-pointer" style={{ height: `${height}%` }}>
                  <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm" style={{ height: `${height * 0.7}%` }}></div>
                </div>
                <span className="text-xs text-slate-500">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Atividades Recentes</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-300">U{i}</span>
                </div>
                <div>
                  <p className="text-sm text-slate-300">
                    <span className="font-medium text-white">Usuário {i}</span> moveu o ticket <span className="text-indigo-400">#102{i}</span> para "Concluído"
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Há {i * 15} minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
