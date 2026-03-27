import { useChatStore } from '@/stores/chat.store'

export default function ImagePreview() {
  const { previewImage, setPreviewImage } = useChatStore()
  if (!previewImage) return null

  return (
    <div
      onClick={() => setPreviewImage(null)}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1000] flex items-center justify-center cursor-zoom-out"
    >
      <img src={previewImage} className="max-w-[88vw] max-h-[88vh] rounded-2xl shadow-2xl" alt="preview" />
      <button
        onClick={() => setPreviewImage(null)}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
      >
        ✕
      </button>
    </div>
  )
}
