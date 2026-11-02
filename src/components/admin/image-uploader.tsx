'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { cldImage } from '@/lib/format'
import type { ProductImage } from '@/lib/types'
import { cn } from '@/lib/utils'

const MAX_MB = 8
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Signed direct upload: browser → Cloudinary (the API secret stays on the server). */
export async function uploadToCloudinary(file: File, onProgress?: (pct: number) => void): Promise<ProductImage> {
  const sigRes = await fetch('/api/admin/upload-signature', { method: 'POST' })
  const sig = await sigRes.json()
  if (!sigRes.ok) throw new Error(sig.error || 'Could not start upload')

  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', sig.apiKey)
  fd.append('timestamp', String(sig.timestamp))
  fd.append('folder', sig.folder)
  fd.append('signature', sig.signature)

  // XHR (not fetch) so we can show upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: data.secure_url, publicId: data.public_id })
        else reject(new Error(data?.error?.message || 'Image upload failed'))
      } catch {
        reject(new Error('Image upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error while uploading'))
    xhr.send(fd)
  })
}

export function ImageUploader({ value, onChange, fallback, className, label = 'Product photo' }: { value: ProductImage | null; onChange: (v: ProductImage | null) => void; fallback?: string; className?: string; label?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [drag, setDrag] = useState(false)

  async function handle(file: File | undefined) {
    if (!file) return
    if (!TYPES.includes(file.type)) return toast.error('Please choose a JPG, PNG, WebP or AVIF image')
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Image must be smaller than ${MAX_MB} MB`)
    setProgress(0)
    try {
      onChange(await uploadToCloudinary(file, setProgress))
      toast.success('Photo uploaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className={className}>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]) }}
        className={cn('relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-cream transition', drag ? 'border-brand-500 bg-brand-50' : 'border-border')}
      >
        {value ? (
          <img src={cldImage(value.url, 600)} alt="Product photo preview" className="h-full w-full object-contain p-3" onError={(e) => ((e.currentTarget.style.visibility = 'hidden'))} />
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex flex-col items-center gap-2 p-4 text-center">
            {fallback ? <span className="text-6xl">{fallback}</span> : <UploadCloud className="h-10 w-10 text-muted-foreground" />}
            <span className="text-sm font-bold text-brand-700">Click or drop a photo</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP · max {MAX_MB} MB</span>
          </button>
        )}
        {progress !== null && (
          <div className="absolute inset-0 grid place-items-center bg-white/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-brand-700" />
              <span className="text-sm font-bold">{progress}%</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={progress !== null} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold ring-1 ring-border hover:bg-cream disabled:opacity-50">
          <ImagePlus className="h-4 w-4" /> {value ? 'Replace' : 'Upload'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} disabled={progress !== null} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Remove
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={TYPES.join(',')} className="hidden" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}
