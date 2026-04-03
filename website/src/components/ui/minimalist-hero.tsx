import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface MinimalistHeroProps {
  logoText: string
  navLinks: { label: string; href: string }[]
  mainText: string
  ctaPrimary: { label: string; onClick: () => void }
  ctaSecondary: { label: string; onClick: () => void }
  centerContent: React.ReactNode
  overlayText: { part1: string; part2: string }
  locationText: string
  className?: string
}

export const MinimalistHero = ({
  logoText, navLinks, mainText, ctaPrimary, ctaSecondary,
  centerContent, overlayText, locationText, className,
}: MinimalistHeroProps) => {
  return (
    <div className={cn(
      'relative flex h-screen w-full flex-col items-center justify-between overflow-hidden p-8 md:p-12',
      'bg-[#F5F0E8]',
      className
    )}>
      {/* Grain overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* Header */}
      <header className="z-30 flex w-full max-w-7xl items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="text-sm font-bold tracking-[0.3em] text-[#0F0E0A]">
          {logoText}
        </motion.div>
        <nav className="hidden items-center space-x-10 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}
              className="text-xs font-medium tracking-[0.2em] text-[#8A8070] transition-colors hover:text-[#0F0E0A]">
              {link.label}
            </a>
          ))}
        </nav>
        <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          onClick={ctaPrimary.onClick}
          className="hidden md:block bg-[#0F0E0A] text-[#F5F0E8] text-xs tracking-[0.2em] px-6 py-3 hover:bg-[#C9A84C] hover:text-[#0F0E0A] transition-colors cursor-pointer">
          {ctaPrimary.label}
        </motion.button>
      </header>

      {/* Main Content */}
      <div className="relative grid w-full max-w-7xl flex-grow grid-cols-1 items-center gap-8 md:grid-cols-3">

        {/* Left — description + CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="z-20 order-2 md:order-1 flex flex-col gap-6">
          <p className="text-sm leading-relaxed text-[#8A8070] max-w-xs">{mainText}</p>
          <div className="flex flex-col gap-3">
            <button onClick={ctaPrimary.onClick}
              className="bg-[#0F0E0A] text-[#F5F0E8] text-xs tracking-[0.2em] px-8 py-4 hover:bg-[#C9A84C] hover:text-[#0F0E0A] transition-colors text-left cursor-pointer">
              {ctaPrimary.label} →
            </button>
            <button onClick={ctaSecondary.onClick}
              className="border border-[#D8D0B8] text-[#8A8070] text-xs tracking-[0.2em] px-8 py-4 hover:border-[#0F0E0A] hover:text-[#0F0E0A] transition-colors text-left cursor-pointer">
              {ctaSecondary.label}
            </button>
          </div>
          <p className="text-xs text-[#8A8070] tracking-[0.15em]">{locationText}</p>
        </motion.div>

        {/* Center — phone mockup */}
        <div className="relative order-1 md:order-2 flex justify-center items-center h-full">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="absolute z-0 h-[280px] w-[280px] md:h-[380px] md:w-[380px] rounded-full bg-[#C9A84C]/20" />
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="relative z-10">
            {centerContent}
          </motion.div>
        </div>

        {/* Right — large editorial headline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="z-20 order-3 flex items-center justify-center md:justify-end">
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif' }}
            className="text-6xl md:text-7xl lg:text-8xl font-light text-[#0F0E0A] leading-[0.9] text-right">
            <span className="block">{overlayText.part1}</span>
            <span className="block italic text-[#C9A84C]">{overlayText.part2}</span>
          </h1>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <footer className="z-30 flex w-full max-w-7xl items-center justify-between border-t border-[#D8D0B8] pt-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="text-xs tracking-[0.2em] text-[#8A8070]">
          LOYALTY & REZERVACIJE
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          className="text-xs tracking-[0.2em] text-[#8A8070]">
          EST. 2025
        </motion.div>
      </footer>
    </div>
  )
}
