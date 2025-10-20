import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatMessage, ChatMessageData } from '../components/ChatMessage'
import { ChatInput } from '../components/ChatInput'
import { HistoryList } from '../components/HistoryList'
import { DotTypingIndicator } from '../components/TypingAnimation'
import { SettingsModal } from '../components/SettingsModal'
import { Loader2, Plus, Search, Settings, ChevronLeft, ChevronRight, ListTodo, ChevronDown, Globe2 } from 'lucide-react'
import { HaloWordmark } from '../components/HaloWordmark'
import { CosmosBackground } from '../components/CosmosBackground'
import { QuickActions } from '../components/QuickActions'
import BlackholeLoader from '../components/BlackholeLoader'
import { Modal } from '../components/Modal'
import { AnimatedStars } from '../components/AnimatedStars'
import { AnimatePresence, motion } from 'framer-motion'

export interface History { id:string; createdAt:number; messages:ChatMessageData[]; preview:string; summary?:string }

function newHistory():History{ return { id:crypto.randomUUID(), createdAt:Date.now(), messages:[], preview:'', summary:'' } }

// Generate a short summary for chat history
function generateSummary(messages: ChatMessageData[]): string {
  if (messages.length === 0) return 'Empty chat';
  if (messages.length === 1) return messages[0].content.slice(0, 40) + '...';
  
  const userMessages = messages.filter(m => m.role === 'user');
  const topics = userMessages.slice(0, 2).map(m => m.content.slice(0, 20)).join(', ');
  return `${userMessages.length} messages: ${topics}${userMessages.length > 2 ? '...' : ''}`;
}

export default function App(){
  const [histories,setHistories] = useState<History[]>([]) // only persisted chats
  const [active,setActive] = useState<History>(()=> newHistory()) // draft or active
  const [activeId,setActiveId] = useState<string|undefined>(undefined)
  const activeResolved = active
  const [loading,setLoading]=useState(false)
  const [typing,setTyping]=useState(false)
  const [idle,setIdle] = useState(false)
  const [idleEnabled, setIdleEnabled] = useState(true) // show idle only before first message
  const [searching,setSearching]=useState(false)
  const [searchQuery,setSearchQuery]=useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [mounted,setMounted] = useState(false) // simple, subtle appear on first load
  const [initialLoad, setInitialLoad] = useState(true);
  const asideRef = useRef<HTMLDivElement|null>(null)
  const [asideW,setAsideW] = useState(0)
  const [navCollapsed,setNavCollapsed] = useState<boolean>(()=>{
    try { return localStorage.getItem('halo_nav_collapsed') === '1' } catch { return false }
  })
  const setCollapsed = useCallback((next:boolean)=>{
    setNavCollapsed(next)
    try { localStorage.setItem('halo_nav_collapsed', next? '1':'0') } catch {}
  },[])
  // Helpers to keep overlay/search state in sync with sidebar transitions
  const collapseSidebar = useCallback(()=>{
    setSearching(false)
    setSearchQuery('')
    setCollapsed(true)
  },[])
  const expandSidebar = useCallback(()=>{
    setSearching(false)
    setSearchQuery('')
    setCollapsed(false)
  },[])
  const bottomRef = useRef<HTMLDivElement|null>(null)
  const scrollContainerRef = useRef<HTMLDivElement|null>(null)
  const sendingRef = useRef(false)
  const [userId] = useState(()=> 'user-'+Math.random().toString(36).slice(2,8))
  const [channelId] = useState('halo-general')
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const manualScrollRef = useRef(false)
  const lastScrollTopRef = useRef(0)
  const [quickActive, setQuickActive] = useState<Set<string>>(()=> new Set())
  const [draftValue, setDraftValue] = useState('')
  const [tavilyResults, setTavilyResults] = useState<any|null>(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const handleQuickToggle = (label:string, cb:()=>void) => {
    setQuickActive(prev => {
      const next = new Set(prev)
      const willActivate = !next.has(label)
      if(next.has(label)) next.delete(label)
      else next.add(label)

      // If enabling Web Search, fetch tavily results for current draft
      if(label === 'Web Search' && willActivate){
        (async ()=>{
          try{
            const resp = await fetch('http://localhost:3000/search/tavily',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query: draftValue || '', limit: 5 }) })
            if(!resp.ok) throw new Error('Fetch failed')
            const json = await resp.json().catch(()=>null)
            setTavilyResults(json)
          }catch(e){ 
            console.warn('Failed to fetch tavily', e)
            setShowMaintenanceModal(true)
          }
        })()
      }
      if(label === 'Web Search' && !willActivate){
        setTavilyResults(null)
      }
      return next
    })
    try { cb() } catch {}
  }
  // stars handled by AnimatedStars

  useEffect(() => {
    if (quickActive.has('Web Search') && draftValue.trim()) {
      (async () => {
        try {
          const resp = await fetch('http://localhost:3000/search/tavily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: draftValue, limit: 5 })
          });
          if (!resp.ok) throw new Error('Fetch failed');
          const json = await resp.json().catch(() => null);
          setTavilyResults(json);
        } catch (e) {
          console.warn('Failed to fetch tavily', e);
          setShowMaintenanceModal(true);
        }
      })();
    }
  }, [draftValue, quickActive])

  useEffect(()=>{ 
    if (autoScrollEnabled) {
      bottomRef.current?.scrollIntoView({behavior:'smooth'}) 
    }
  },[activeResolved.messages.length, autoScrollEnabled])

  // Detect manual scrolling to pause auto-scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const isScrollingUp = scrollTop < lastScrollTopRef.current
      lastScrollTopRef.current = scrollTop

      if (isScrollingUp) {
        manualScrollRef.current = true
        setAutoScrollEnabled(prev => (prev ? false : prev))
        return
      }

      if (manualScrollRef.current) {
        if (distanceFromBottom <= 24) {
          manualScrollRef.current = false
          setAutoScrollEnabled(prev => (prev ? prev : true))
        }
        return
      }

      if (distanceFromBottom <= 120) {
        setAutoScrollEnabled(prev => (prev ? prev : true))
      } else {
        setAutoScrollEnabled(prev => (prev ? false : prev))
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Pass auto-scroll state to typing animation
  const scrollToBottom = useCallback((opts?: { force?: boolean; behavior?: ScrollBehavior }) => {
    if ((autoScrollEnabled || opts?.force) && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: opts?.behavior ?? 'smooth', block: 'nearest' })
    }
  }, [autoScrollEnabled])

  // simple appear animation on initial mount
  useEffect(()=>{
    const id = requestAnimationFrame(()=> setMounted(true))
    return ()=> cancelAnimationFrame(id)
  },[])

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 100); // Small delay to allow initial layout calculation
    return () => clearTimeout(timer);
  }, []);

  // idle detection (10s of no typing / no new messages interaction) — only before first message
  useEffect(()=>{
    if(!idleEnabled){
      // once disabled, ensure hidden and don't register listeners
      setIdle(false)
      return
    }
    let timer: number | undefined
    function reset(){
      setIdle(false)
      if(timer) window.clearTimeout(timer)
      timer = window.setTimeout(()=> setIdle(true), 10000)
    }
    const events = ['mousemove','keydown','click','wheel','touchstart']
    events.forEach(ev=> window.addEventListener(ev, reset, {passive:true}))
    reset()
    return ()=>{ events.forEach(ev=> window.removeEventListener(ev, reset)); if(timer) window.clearTimeout(timer) }
  },[idleEnabled])
  // typing cancels idle immediately
  useEffect(()=>{ if(typing) setIdle(false) },[typing])

  // measure sidebar width for perfect centering relative to viewport
  useEffect(()=>{
    const el = asideRef.current
    if(!el) return
    const update = ()=> setAsideW(el.offsetWidth || 0)
    update()
    const ro = new ResizeObserver(()=> update())
    ro.observe(el)
    return ()=> ro.disconnect()
  },[navCollapsed])

  function updateHistory(id:string, fn:(h:History)=>void){
    setHistories((hs:History[]) => hs.map((h:History) => {
      if(h.id!==id) return h
      const clone:History = { ...h, messages:[...h.messages] }
      fn(clone)
      return clone
    }))
    if(activeId===id){
      setActive(a=>{ const clone:History={...a, messages:[...a.messages]}; fn(clone); return clone })
    }
  }

  const handleTypingComplete = useCallback((messageId: string) => {
    setActive(a=> {
      const updated = {...a, messages: a.messages.map(m => 
        m.id === messageId ? {...m, isTyping: false} : m
      )};
      if(activeId){
        setHistories(hs=> hs.map(h=> h.id===activeId? {...h, messages:updated.messages}: h));
      }
      return updated;
    })
  }, [activeId])

  const newChatIdRef = useRef<string | undefined>(undefined);
  const sendMessage = useCallback(async (text:string)=>{
    if(!text.trim()) return;
    if(sendingRef.current) return;
  manualScrollRef.current = false
  setAutoScrollEnabled(prev => (prev ? prev : true))
    requestAnimationFrame(()=> scrollToBottom({ force:true }))
    setIdle(false);
    setIdleEnabled(false);
    const msg:ChatMessageData={ id:crypto.randomUUID(), role:'user', content:text, createdAt:Date.now() };
    let isNewChat = false;
    setActive(a => {
      const next = { ...a, messages: [...a.messages, msg] };
      if (!next.preview) next.preview = text.slice(0, 60);
      next.summary = generateSummary(next.messages);
      if (!activeId) {
        isNewChat = true;
        newChatIdRef.current = next.id;
        return { ...next, id: next.id };
      }
      return next;
    });
    if (!activeId) {
      // Only add to histories and set activeId once, outside of setActive
      setActiveId(a => newChatIdRef.current || a);
      setHistories(hs => [{ ...active, id: newChatIdRef.current || active.id, messages: [...active.messages, msg], preview: msg.content.slice(0, 60), summary: generateSummary([...active.messages, msg]) }, ...hs]);
    } else {
      setHistories(hs => hs.map(h => h.id === activeId ? { ...h, messages: [...h.messages, msg], preview: msg.content.slice(0, 60), summary: generateSummary([...h.messages, msg]) } : h));
    }
    setLoading(true);
    sendingRef.current = true;
    setTyping(false);
    
    try {
      const resp = await fetch('http://localhost:3000/chat/message',{ 
        method:'POST',
        headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ channelId, userId, text, haloThink: Array.from(quickActive).includes('WarpThink'), webSearch: Array.from(quickActive).includes('Web Search'), tavilyResults })
      })
      if(!resp.ok){
        console.error('Backend error', resp.status)
        const errTxt = await resp.text().catch(()=> '')
        throw new Error(errTxt || 'Backend error')
      }
      const data = await resp.json().catch(()=>({})) as any
      const answer = (data && data.reply) ? String(data.reply) : '(No reply)'
      
      // Create reply with typing animation enabled
      const reply:ChatMessageData={ 
        id:crypto.randomUUID(), 
        role:'assistant', 
        content:answer, 
        createdAt:Date.now(),
        isTyping: true 
      }
      
      // Update active conversation
      setActive(a=> {
        const updated = {...a, messages:[...a.messages, reply]};
        updated.summary = generateSummary(updated.messages);
        // Update in histories using the correct chat ID
        const chatId = newChatIdRef.current || activeId;
        if(chatId){
          setHistories(hs=> hs.map(h=> h.id===chatId? {...h, messages:updated.messages, summary:updated.summary}: h));
        }
        return updated;
      })
      
    } catch (e:any) {
      const reply:ChatMessageData={ id:crypto.randomUUID(), role:'assistant', content:`(Error) ${e?.message || 'Failed to get a reply.'}`, createdAt:Date.now() }
      
      // Update active conversation with error
      setActive(a=> {
        const updated = {...a, messages:[...a.messages, reply]};
        updated.summary = generateSummary(updated.messages);
        // Update in histories using the correct chat ID
        const chatId = newChatIdRef.current || activeId;
        if(chatId){
          setHistories(hs=> hs.map(h=> h.id===chatId? {...h, messages:updated.messages, summary:updated.summary}: h));
        }
        return updated;
      })
    } finally {
      setLoading(false)
      sendingRef.current = false
    }
  },[activeId, channelId, userId, active.id, quickActive, scrollToBottom])

  const stop = useCallback(async ()=>{
    setLoading(false)
    fetch('http://localhost:3000/chat/stop',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channelId }) })
  },[channelId])

  const createChat = ()=>{
    if(!active.messages.length) return // already drafting
    const h=newHistory();
    setActive(h)
    setActiveId(undefined)
  }

  const allMessages = activeResolved.messages

  const filteredHistories = searching && searchQuery.trim()? histories.filter(h=>
    h.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.messages.some(m=> m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  ): histories

  const classTyping = typing? 'typing':''

  // Remove bias/offset: always center in viewport
  const centerOffset = 0

  return <div className={`h-full w-full flex text-slate-100 relative bg-black overflow-hidden ${classTyping}`}>
    {/* Idle background needs to cover entire viewport (including behind the sidebar) */}
    <AnimatePresence initial={false}>
      {idleEnabled && idle && !typing && navCollapsed && (
        <motion.div key='cosmos' className='absolute inset-0 z-30 pointer-events-none'
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1.2,ease:'easeOut'}}>
          <CosmosBackground offsetX={0} />
        </motion.div>
      )}
    </AnimatePresence>

  <motion.aside
      ref={asideRef}
      initial={false}
      animate={navCollapsed? {width:64} : {width:288}}
      transition={{type:'spring', stiffness:180, damping:26}}
  className='hidden md:flex flex-col overflow-hidden border border-white/15 bg-black/70 backdrop-blur-xl relative z-20'
    >
      <AnimatePresence mode='wait' initial={false}>
        {!navCollapsed ? (
          <motion.div key='expanded' className='flex flex-col h-full relative z-20' initial={{opacity:0, x:-16}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-16}} transition={{duration:0.28, ease:'easeOut'}}>
            <div className='px-4 pt-4 pb-2 flex flex-col gap-3 border-b border-white/10'>
              <div className='flex items-center gap-3'>
                <div className='relative group w-16 h-16'>
                  {/* Logo (visible by default, hides on hover) */}
                  <img
                    src='/halo-logo.png'
                    alt='HALO Logo'
                    className='absolute inset-0 m-auto w-16 h-16 object-contain select-none drop-shadow-[0_0_8px_rgba(160,220,255,0.35)] transition-opacity duration-150 group-hover:opacity-0'
                  />
                  {/* Big collapse icon replaces logo on hover */}
                  <button
                    type='button'
                    onClick={()=>setCollapsed(true)}
                    aria-label='Collapse sidebar'
                    title='Collapse sidebar'
                    className='absolute inset-0 m-auto w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
                  >
                    <ChevronLeft className='w-5 h-5' />
                  </button>
                </div>
                <button onClick={()=>{ setSearching(s=>!s); if(searching){ setSearchQuery('') } }} className={`ml-auto rounded-lg p-2 border transition-colors ${searching? 'bg-white/15 border-white/25' : 'bg-white/5 hover:bg-white/10 border-white/10'}`} title='Search chats'>
                  <Search className='w-5 h-5'/>
                </button>
              </div>
              {searching && <div className='relative'>
                <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder='Search chats' className='w-full text-xs rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 px-3 py-2 placeholder:text-slate-500' />
                {searchQuery && <button onClick={()=>setSearchQuery('')} className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs'>×</button>}
              </div>}
            </div>
            <div className='flex-1 min-h-0 flex flex-col'>
              <div className='p-3 pt-4 flex flex-col gap-2 border-b border-white/5'>
                <button onClick={createChat} className={`w-full group rounded-lg px-3 py-2 border text-xs font-medium tracking-wide flex items-center gap-2 transition-colors ${active.messages.length? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'}`} title='Start a new chat draft'>
                  <Plus className='w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity' />
                  <span className='truncate'>New Chat</span>
                </button>
                <button className='w-full group rounded-lg px-3 py-2 border text-xs font-medium tracking-wide flex items-center gap-2 transition-colors bg-white/5 hover:bg-white/10 border-white/10' title='Tasks'>
                  <ListTodo className='w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity' />
                  <span className='truncate'>Tasks</span>
                </button>
              </div>
              <div className='flex-1 min-h-0'>
                <HistoryList collapsed={false} items={filteredHistories} searching={searching} query={searchQuery} activeId={activeId} onSelect={id=>{ const found=histories.find(h=>h.id===id); if(found){ setActive(found); setActiveId(id) } }} onDelete={(id)=>{
                  setHistories(h=> h.filter(x=>x.id!==id))
                  if(id===activeId){
                    const remaining = histories.filter(x=>x.id!==id)
                    if(remaining[0]){ setActive(remaining[0]); setActiveId(remaining[0].id) } else { const fresh=newHistory(); setActive(fresh); setActiveId(undefined) }
                  }
                }}/>
              </div>
            </div>
            <div className='p-3 border-t border-white/10 flex items-center justify-end gap-2'>
              <button 
                onClick={() => setShowSettings(true)}
                className='rounded-lg bg-white/5 hover:bg-white/10 p-2 border border-white/10 transition-colors w-9 h-9 flex items-center justify-center' 
                title='Settings'
              >
                <Settings className='w-4 h-4'/>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key='collapsed' className='flex flex-col items-center py-3 gap-4 flex-1 relative z-20' initial={{opacity:0, x:16}} animate={{opacity:1, x:0}} exit={{opacity:0, x:16}} transition={{duration:0.28, ease:'easeOut'}}>
            <div className='relative group w-14 h-14'>
              {/* Logo (visible by default, hides on hover) */}
              <img
                src='/halo-logo.png'
                alt='HALO Logo'
                className='absolute inset-0 m-auto w-12 h-12 object-contain select-none drop-shadow-[0_0_6px_rgba(160,220,255,0.35)] transition-opacity duration-150 group-hover:opacity-0'
              />
              {/* Big expand icon replaces logo on hover */}
              <button
                type='button'
                onClick={()=>setCollapsed(false)}
                aria-label='Expand sidebar'
                title='Expand sidebar'
                className='absolute inset-0 m-auto w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
              >
                <ChevronRight className='w-6 h-6' />
              </button>
            </div>
            <div className='flex flex-col gap-3 mt-2'>
              <button onClick={()=>{ setSearching(s=>!s); if(searching){ setSearchQuery('') } }} className={`rounded-full h-11 w-11 border flex items-center justify-center transition-colors ${searching? 'bg-white/15 border-white/25' : 'bg-white/5 hover:bg-white/10 border-white/10'}`} title='Search'>
                <Search className='w-5 h-5'/>
              </button>
              <button onClick={createChat} className={`rounded-full h-11 w-11 border flex items-center justify-center transition-colors ${active.messages.length? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white/5 border-white/10 opacity-50'}`} title='New chat'>
                <Plus className='w-5 h-5'/>
              </button>
              <button className='rounded-full h-11 w-11 border flex items-center justify-center bg-white/5 hover:bg-white/10 border-white/10 transition-colors' title='Tasks'>
                <ListTodo className='w-5 h-5'/>
              </button>
            </div>
            <div className='flex-1 w-full overflow-y-auto'>
              <HistoryList collapsed items={filteredHistories} activeId={activeId} onSelect={id=>{ const found=histories.find(h=>h.id===id); if(found){ setActive(found); setActiveId(id) } }} onDelete={(id)=>{
                setHistories(h=> h.filter(x=>x.id!==id))
                if(id===activeId){
                  const remaining = histories.filter(x=>x.id!==id)
                  if(remaining[0]){ setActive(remaining[0]); setActiveId(remaining[0].id) } else { const fresh=newHistory(); setActive(fresh); setActiveId(undefined) }
                }
              }} />
            </div>
            <div className='mt-auto flex flex-col items-center gap-3 pb-1'>
              <button 
                onClick={() => setShowSettings(true)}
                className='rounded-full h-11 w-11 border flex items-center justify-center bg-white/5 hover:bg-white/10 border-white/10 transition-colors' 
                title='Settings'
              >
                <Settings className='w-5 h-5'/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
    <main className={'flex-1 flex flex-col relative bg-black '+(mounted? 'opacity-100 transition-opacity duration-200' : 'opacity-0')}>
      <AnimatePresence initial={false}>
        {typing && <div className='absolute inset-0 z-0 pointer-events-none'><AnimatedStars active={typing} typing={typing} /></div>}
      </AnimatePresence>
  <motion.div ref={scrollContainerRef} initial={false} className={`flex-1 overflow-y-auto px-4 md:px-10 lg:px-24 py-10 space-y-6 relative z-10 chat-scroll-container flex flex-col ${allMessages.length === 0 && !loading ? 'items-center justify-center' : 'items-start'}`} transition={initialLoad ? { duration: 0 } : {type:'spring', stiffness:180, damping:24}}>
  {allMessages.length===0 && !loading && (
  <div className={`flex flex-1 flex-col gap-10 min-h-[70vh] w-full transition-transform duration-500${allMessages.length === 0 && !loading ? ' justify-center items-center -translate-y-4 md:-translate-y-8 -translate-x-[21px]' : ''}`}> 
      <div className='flex justify-center w-full px-4'>
        <HaloWordmark />
      </div>
      <motion.div layoutId='chat-input' initial={false} className='w-full max-w-3xl mx-auto'>
        <ChatInput mode='hero' disabled={loading} onTyping={(st)=>setTyping(st)} onSend={t=>{ setTyping(false); sendMessage(t) }} onStop={stop} onValueChange={(v)=>setDraftValue(v)} />
      </motion.div>
      <div className='w-full max-w-3xl mx-auto -mt-2'>
        <QuickActions active={quickActive} onToggle={handleQuickToggle} />
      </div>
    </div>
  )}
        {allMessages.map(m=> <ChatMessage key={m.id} m={m} onTypingComplete={handleTypingComplete} onRequestScroll={scrollToBottom} />)}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex justify-start"
          >
            <div className="bg-[#141a22]/70 text-slate-200 border border-white/5 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] relative rounded-2xl px-4 py-3 backdrop-blur-md
              before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:bg-[linear-gradient(140deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_35%,rgba(255,255,255,0)_65%,rgba(255,255,255,0.08))] before:opacity-40
              after:absolute after:top-px after:left-px after:right-px after:bottom-px after:rounded-[1rem] after:pointer-events-none after:border after:border-white/5"
            >
              {Array.from(quickActive).includes('WarpThink') ? (
                <div className='flex items-center gap-3'>
                  <BlackholeLoader size={48} />
                  <span className='text-slate-300'>HALO is thinking (deep)</span>
                </div>
              ) : (
                <DotTypingIndicator />
              )}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef}></div>
      </motion.div>
      
      {/* Scroll to bottom button - appears when auto-scroll is disabled and there are messages */}
      <AnimatePresence>
        {!autoScrollEnabled && allMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-6 z-40"
          >
            <button
              onClick={() => {
                manualScrollRef.current = false
                setAutoScrollEnabled(prev => (prev ? prev : true))
                scrollToBottom({ force: true })
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white text-sm font-medium shadow-lg backdrop-blur-sm border border-blue-500/30 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Scroll to bottom
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence initial={false} mode='wait'>
        {allMessages.length>0 && (
          <motion.div
            key='input-bottom'
            layoutId='chat-input'
            initial={false}
            animate={{opacity:1, y:0}}
            exit={{opacity:0, y:40}}
            transition={{duration:0.5, ease:'easeOut'}}
            className='relative z-30 bg-black/60 backdrop-blur-xl px-4 md:px-10 lg:px-32 pt-4 pb-6 shadow-[0_-8px_32px_-10px_rgba(0,0,0,0.8)]'
          >
            <motion.div initial={false} className='w-full max-w-4xl mx-auto space-y-4' transition={{type:'spring', stiffness:180, damping:24}}>
              <ChatInput disabled={loading} onTyping={(st)=>setTyping(st)} onSend={t=>{ setTyping(false); sendMessage(t) }} onStop={stop} onValueChange={(v)=>setDraftValue(v)} />
              <QuickActions active={quickActive} onToggle={handleQuickToggle} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
    <AnimatePresence>
      {navCollapsed && searching && (
        <Modal onClose={()=>{ setSearching(false); setSearchQuery('') }}>
          <motion.div
            initial={{y:-12, opacity:0, scale:0.98}}
            animate={{y:0, opacity:1, scale:1}}
            exit={{y:-10, opacity:0, scale:0.98}}
            transition={{duration:0.18, ease:'easeOut'}}
          >
            <div className='relative rounded-2xl bg-black border border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_24px_64px_-24px_rgba(0,0,0,0.9)] overflow-hidden min-h-[56vh] flex flex-col'>
              <div className='p-3 border-b border-white/10'>
                <div className='relative'>
                  <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder='Search chats…' className='w-full rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 px-4 py-3 text-sm placeholder:text-slate-500' />
                  {searchQuery && <button onClick={()=>setSearchQuery('')} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm'>×</button>}
                </div>
              </div>
              <div className='flex-1 overflow-y-auto p-3'>
                {filteredHistories.length===0 ? (
                  <div className='text-xs text-slate-500 px-2 py-4 text-center'>No matching chats</div>
                ) : (
                  <ul className='divide-y divide-white/5'>
                    {filteredHistories.map(h=> (
                      <li key={h.id}>
                        <button
                          onClick={()=>{ const found=histories.find(x=>x.id===h.id); if(found){ setActive(found); setActiveId(h.id) } setSearching(false) }}
                          className={`w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3 ${activeId===h.id? 'bg-white/5':''}`}
                        >
                          <span className='inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-300'>
                            {h.preview ? h.preview.slice(0,1).toUpperCase() : '•'}
                          </span>
                          <div className='min-w-0'>
                            <div className='text-[13px] truncate text-slate-200'>{h.preview || 'Untitled chat'}</div>
                            <div className='text-[11px] text-slate-500 truncate'>{h.messages[h.messages.length-1]?.content || 'No messages yet'}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>

    {/* Settings Modal */}
    <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

    {/* Maintenance Modal */}
    <AnimatePresence>
      {showMaintenanceModal && (
        <Modal onClose={() => {
          setShowMaintenanceModal(false);
          setQuickActive(prev => {
            const next = new Set(prev);
            next.delete('Web Search');
            return next;
          });
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black border border-white/20 rounded-2xl p-6 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
                <Globe2 className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Under Maintenance</h3>
              <p className="text-white/70 text-sm mb-4">
                Web Search is currently under maintenance. Please try again later.
              </p>
              <button
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setQuickActive(prev => {
                    const next = new Set(prev);
                    next.delete('Web Search');
                    return next;
                  });
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  </div>
}
