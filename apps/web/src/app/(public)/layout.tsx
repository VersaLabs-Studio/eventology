import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import FooterCTA from "@/components/ui/FooterCTA";
import { AIChatWidget } from "@/components/ai/ai-chat-widget";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 sm:pt-20 md:pt-0">{children}</main>
      <FooterCTA className="bg-foreground text-background border-b border-white/5" />
      <Footer />
      <AIChatWidget />
    </>
  );
}

