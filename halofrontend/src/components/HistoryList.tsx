import { motion, AnimatePresence } from 'framer-motion'
import type { History } from '../pages/App'
import { MessageCircle, Trash2, Search } from 'lucide-react'

interface Props {
  items: History[]
  activeId?: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  searching?: boolean
  query?: string
  collapsed?: boolean
}

export function HistoryList({ items, activeId, onSelect, onDelete, searching, query, collapsed }: Props) {
  const empty = items.length === 0

  // Collapsed (icon-only) sidebar
  if (collapsed) {
    return (
      <div className="flex flex-col gap-3 py-3 px-2 overflow-y-auto h-full items-center sidebar-history-collapsed">
        {items.map((h) => (
          <motion.div
            key={h.id}
            layout
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.92 }}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
              h.id === activeId
                ? 'border-white/35 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_4px_10px_-4px_rgba(0,0,0,0.8)]'
                : 'border-white/10 bg-white/5 hover:bg-white/8'
            }`}
            title={h.preview || 'New Chat'}
          >
            <button
              onClick={() => onSelect(h.id)}
              className="absolute inset-0 w-full h-full rounded-2xl flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <span className="text-[10px] font-medium text-slate-300 leading-none text-center px-1 line-clamp-3">
                {(h.preview || 'New').slice(0, 3)}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(h.id)
              }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600/70 hover:bg-red-600 flex items-center justify-center text-[10px] text-white shadow z-10"
            >
              ×
            </button>
          </motion.div>
        ))}
      </div>
    )
  }

  // Expanded sidebar (full view)
  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full custom-scrollbar">
      {empty &&
        (!searching ? (
          <div className="text-xs text-slate-400 flex flex-col items-center gap-2 pt-10">
            <MessageCircle className="w-6 h-6 opacity-50" />
            No chats yet
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex flex-col items-center gap-2 pt-10">
            <Search className="w-5 h-5 opacity-50" />
            No matches{query ? ` for "${query.slice(0, 30)}"` : ''}
          </div>
        ))}

      <AnimatePresence initial={false}>
        {items.map((h) => (
          <motion.div
            key={h.id}
            layout
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`group relative rounded-xl overflow-hidden ${
              h.id === activeId ? 'bg-white/10 ring-1 ring-white/15' : ''
            }`}
          >
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => onSelect(h.id)}
              className="w-full text-left px-4 py-3 pr-12 flex flex-col gap-1 transition-colors"
            >
              <div className="text-[10px] tracking-wide uppercase text-slate-500">
                {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm leading-snug line-clamp-2 text-slate-200">
                {h.preview || 'New Chat'}
              </div>
              {h.summary && (
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{h.summary}</div>
              )}
            </motion.button>
            <button
              onClick={() => onDelete(h.id)}
              className="opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-red-600/10 hover:bg-red-600/40 text-red-400 hover:text-red-200 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
