import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="font-display font-bold text-9xl text-primary/20">404</h1>
      <h2 className="font-display font-semibold text-2xl mt-4">Page not found</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-4 mt-8">
        <Link href="/">
          <Button variant="default" size="lg">Go Home</Button>
        </Link>
        <Link href="/events">
          <Button variant="outline" size="lg">Browse Events</Button>
        </Link>
      </div>
    </div>
  );
}
