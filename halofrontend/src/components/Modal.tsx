import { PropsWithChildren, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  onClose?: () => void
}

export function Modal({ children, onClose }: PropsWithChildren<ModalProps>){
  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if(e.key==='Escape'){ onClose?.() } }
    document.addEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  },[onClose])

  return createPortal(
    <div className='fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4' onClick={onClose}>
      <div onClick={e=> e.stopPropagation()} className='w-[min(680px,92vw)]'>
        {children}
      </div>
    </div>,
    document.body
  )
}
