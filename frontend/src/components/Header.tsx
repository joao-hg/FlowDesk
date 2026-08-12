export function Header() {
  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 w-full">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-800 rounded-md leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-indigo-500 sm:text-sm transition-colors"
            placeholder="Buscar solicitações, usuários..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-white transition-colors relative">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950"></span>
        </button>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Solicitação
        </button>
      </div>
    </header>
  );
}
