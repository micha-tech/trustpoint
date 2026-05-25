import Navbar from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
