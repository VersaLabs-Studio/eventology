import type { Metadata } from "next";
import { PublicHomePage } from "./home-page";

export const metadata: Metadata = {
  title: "Eventology — Discover Events in Addis Ababa",
};

export default function HomePage() {
  return <PublicHomePage />;
}
