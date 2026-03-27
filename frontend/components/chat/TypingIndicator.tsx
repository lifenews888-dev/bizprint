export default function TypingIndicator({ names }: { names: string[] }) {
  if (!names.length) return null

  return (
    <div className="flex items-center gap-2 px-6 py-1.5 text-xs text-[#FF6B00] font-medium">
      <span className="inline-flex gap-[3px]">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-[5px] h-[5px] rounded-full bg-[#FF6B00] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
      <span>{names.join(', ')} бичиж байна...</span>
    </div>
  )
}
