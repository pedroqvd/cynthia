'use client'

import { useState, useCallback, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    // Só seta crossOrigin para URLs absolutas (externas/Supabase)
    // Para URLs relativas (/images/...) não precisa, e evita canvas tainted
    if (url.startsWith('http')) {
      image.setAttribute('crossOrigin', 'anonymous')
    }
    image.src = url
  })

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<File | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null)
      resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

interface Props {
  imageFile?: File | null
  imageUrl?: string | null
  aspectRatio: number
  onCancel: () => void
  onConfirm: (croppedFile: File) => void
}

export function ImageCropper({ imageFile, imageUrl, aspectRatio, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setObjectUrl(null)
  }, [imageFile])

  const imageSrc = objectUrl || imageUrl || null

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setProcessing(true)
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedFile) onConfirm(croppedFile)
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog.Root open={!!(imageFile || imageUrl)} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999 }} />
        <Dialog.Content style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '90vw', maxWidth: '800px', height: '80vh', maxHeight: '650px',
          background: '#fff', borderRadius: '8px', zIndex: 10000, display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e5e3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Dialog.Title style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, color: '#0f0e0c' }}>
              Enquadrar Imagem
            </Dialog.Title>
            <button onClick={onCancel} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, color: '#7a7570' }}>
              &times;
            </button>
          </div>

          <div style={{ position: 'relative', flex: 1, background: '#1c1c1c' }}>
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '.8rem', color: '#7a7570', fontWeight: 500 }}>Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#b8965a' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={onCancel}
                style={{ padding: '.6rem 1.25rem', background: '#f5f5f5', border: '1px solid #e5e5e3', borderRadius: '4px', cursor: 'pointer', color: '#0f0e0c', fontSize: '.8rem', fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirm}
                disabled={processing}
                style={{ padding: '.6rem 1.25rem', background: '#b8965a', color: '#fff', border: 'none', borderRadius: '4px', cursor: processing ? 'not-allowed' : 'pointer', fontSize: '.8rem', fontWeight: 500 }}
              >
                {processing ? 'Recortando...' : 'Confirmar Enquadramento'}
              </button>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
