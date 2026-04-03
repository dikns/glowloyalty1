interface PhoneMockupProps {
  primaryColor?: string
  salonName?: string
  animated?: boolean
}

export default function PhoneMockup({ primaryColor = '#C9A84C', salonName = 'Vaš Salon', animated = false }: PhoneMockupProps) {
  const bg = primaryColor
  const anim = animated ? 'animate-[float_4s_ease-in-out_infinite]' : ''

  return (
    <div className={`relative mx-auto ${anim}`} style={{ width: 220, height: 440 }}>
      {/* Phone frame */}
      <div className="absolute inset-0 rounded-[32px] border-[6px] border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0a0a0a] rounded-b-2xl z-10" />

        {/* Screen content */}
        <div className="absolute inset-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-end pb-2 px-4" style={{ background: bg }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20" />
              <span className="text-white text-xs font-medium truncate" style={{ fontFamily: 'DM Sans' }}>
                {salonName}
              </span>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 bg-[#f8f5f0] px-3 py-3 space-y-2 overflow-hidden">
            {/* Points card */}
            <div className="rounded-lg p-3 text-white text-center" style={{ background: bg }}>
              <div className="text-xs opacity-70" style={{ fontFamily: 'DM Sans' }}>Vaše točke</div>
              <div className="text-xl font-bold mt-0.5" style={{ fontFamily: 'Cormorant Garamond' }}>240 pt</div>
              <div className="mt-1.5 bg-white/20 rounded-full h-1">
                <div className="h-1 rounded-full bg-white/80" style={{ width: '48%' }} />
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-1.5">
              {['Rezervacija', 'Moja QR', 'Obiski', 'Nastavitve'].map((label) => (
                <div key={label} className="bg-white rounded p-2 text-center">
                  <div className="w-4 h-4 rounded mx-auto mb-1" style={{ background: bg + '33' }} />
                  <div className="text-[9px] text-gray-600" style={{ fontFamily: 'DM Sans' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Recent visits */}
            <div className="bg-white rounded p-2">
              <div className="text-[9px] text-gray-400 mb-1.5" style={{ fontFamily: 'DM Sans' }}>Zadnji obiski</div>
              {['Manikura', 'Barvanje'].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <span className="text-[8px] text-gray-700">{s}</span>
                  <span className="text-[7px] px-1 rounded-full text-white" style={{ background: bg }}>+20</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="h-10 bg-white border-t border-gray-100 flex items-center justify-around px-2">
            {['▪', '▪', '▪', '▪'].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded" style={{ background: i === 0 ? bg : '#e5e5e5' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div className="absolute inset-0 rounded-[32px] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
    </div>
  )
}
