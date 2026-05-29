'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface ButtonProps {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  external?: boolean;
  icon?: boolean;
}

interface FooterCTAProps {
  title?: string;
  description?: string;
  primaryButton?: ButtonProps;
  secondaryButton?: ButtonProps;
  className?: string;
  showGlow?: boolean;
}

// Spring animation configuration per VersaLabs guidelines
const SPRING = { stiffness: 300, damping: 30 };

const defaultProps: FooterCTAProps = {
  title: "Ready to Build Something Extraordinary?",
  description: "Let's architect your next breakthrough. From MVPs to enterprise-scale solutions, we deliver digital infrastructure that scales.",
  primaryButton: {
    label: "Start Your Project",
    href: "/contact",
    variant: "primary",
  },
  secondaryButton: {
    label: "Explore Our Work",
    href: "https://versalabs-studio.com",
    variant: "secondary",
    external: true,
  },
  showGlow: true,
};

export default function FooterCTA(props: FooterCTAProps = {}) {
  const {
    title = defaultProps.title,
    description = defaultProps.description,
    primaryButton = defaultProps.primaryButton,
    secondaryButton = defaultProps.secondaryButton,
    className = "",
    showGlow = defaultProps.showGlow,
  } = props;

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Animated gradient glow - optional per prop */}
      {showGlow && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-br from-violet-500/6 via-white/[0.02] to-indigo-500/6 blur-[100px] rounded-full pointer-events-none animate-glow-pulse" />
      )}

      <div className="relative z-10 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Title with gradient text effect */}
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
              <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                {title}
              </span>
            </h2>

            {/* Description */}
            <p className="text-base text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {primaryButton && (
                <Link href={primaryButton.href} {...(primaryButton.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                    className="group flex items-center justify-center h-12 px-8 rounded-full bg-white text-black text-[15px] font-semibold transition-colors hover:bg-zinc-200 shadow-lg shadow-white/10"
                  >
                    {primaryButton.label}
                    {primaryButton.icon !== false && (
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </motion.div>
                </Link>
              )}

              {secondaryButton && (
                <Link href={secondaryButton.href} {...(secondaryButton.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <motion.div
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                    className="group flex items-center justify-center h-12 px-8 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm text-white text-[15px] font-medium transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
                  >
                    {secondaryButton.label}
                    {secondaryButton.icon !== false && secondaryButton.external && (
                      <ExternalLink className="ml-2 h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </motion.div>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}