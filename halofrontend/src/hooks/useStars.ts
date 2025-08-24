import { useEffect, useRef } from 'react'

export function useStars(active:boolean, density=60){
  const ref = useRef<HTMLDivElement|null>(null)
  useEffect(()=>{
    const el = ref.current
    if(!el) return
    el.innerHTML=''
    if(!active){ return }
    const count = density
    const frag = document.createDocumentFragment()
    for(let i=0;i<count;i++){
      const s = document.createElement('div')
      s.className='star'
      const delay = Math.random()*5
      const left = Math.random()*100
      const size = Math.random()*2+1
      const duration = 4+Math.random()*6
      s.style.left=left+'%'
      s.style.top=(-10 - Math.random()*80)+'vh'
      s.style.width=size+'px'
      s.style.height=size+'px'
      s.style.animationDelay = delay+'s'
      s.style.animationDuration = duration+'s'
      frag.appendChild(s)
    }
    el.appendChild(frag)
  },[active,density])
  return ref
}
