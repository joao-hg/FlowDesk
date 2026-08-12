import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-md"></div>
          FlowDesk
        </h1>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 bg-indigo-500/10 text-indigo-400 rounded-md font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          Dashboard
        </Link>
        <Link href="/requests" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-900 rounded-md transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Solicitações
        </Link>
        <Link href="/team" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-900 rounded-md transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Equipe
        </Link>
        <Link href="/reports" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-900 rounded-md transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Relatórios
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-white border border-slate-700">
            JH
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">João</p>
            <p className="text-xs text-slate-500 truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
