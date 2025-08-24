import { useEffect, useRef, useState } from 'react'

export function useIdle(timeoutMs=15000){
  const [idle,setIdle] = useState(false)
  const timer = useRef<number|undefined>()
  useEffect(()=>{
    function reset(){
      if(timer.current) window.clearTimeout(timer.current)
      if(idle) setIdle(false)
      timer.current = window.setTimeout(()=> setIdle(true), timeoutMs)
    }
    const events: (keyof DocumentEventMap)[] = ['keydown','pointermove','mousedown','touchstart','wheel','scroll','focus']
    events.forEach(ev=> window.addEventListener(ev, reset, { passive:true }))
    reset()
    return ()=> { events.forEach(ev=> window.removeEventListener(ev, reset)); if(timer.current) window.clearTimeout(timer.current) }
  },[timeoutMs,idle])
  return idle
}
