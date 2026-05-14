import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import FooterCTA from "@/components/ui/FooterCTA";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <FooterCTA className="bg-foreground text-background border-b border-white/5" />
      <Footer />
    </>
  );
}

