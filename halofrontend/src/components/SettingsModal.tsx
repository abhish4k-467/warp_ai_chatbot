import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import { useState } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('experimental')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-black border rounded-2xl overflow-hidden shadow-2xl"
              style={{
                borderImage: 'linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1), rgba(255,255,255,0.3)) 1',
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.1),
                  0 0 20px rgba(255,255,255,0.1),
                  0 0 40px rgba(255,255,255,0.05),
                  0 20px 40px -10px rgba(0,0,0,0.8)
                `
              }}
            >
              {/* Header */}
              <div className="relative p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    Settings
                  </h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white/80" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-white/5">
                <nav className="flex px-6">
                  <button
                    onClick={() => setActiveTab('experimental')}
                    className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'experimental'
                        ? 'text-blue-400'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    Experimental
                    {activeTab === 'experimental' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="p-6 min-h-[300px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'experimental' && (
                    <motion.div
                      key="experimental"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Experimental Features
                          </h3>
                          <p className="text-sm text-white/60 mb-4">
                            These features are in development and may change or be removed in future updates.
                          </p>
                        </div>

                        {/* Placeholder for future settings */}
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-center py-8">
                              <Zap className="w-12 h-12 text-white/20 mx-auto mb-3" />
                              <p className="text-white/40 text-sm">
                                Experimental settings will appear here
                              </p>
                              <p className="text-white/30 text-xs mt-1">
                                Stay tuned for upcoming features!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 bg-white/2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    HALO AI v1.0 • Made by Abhishek Mitra
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
