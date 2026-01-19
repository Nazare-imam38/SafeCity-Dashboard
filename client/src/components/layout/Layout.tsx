import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title = "Dashboard" }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-4 sm:p-6 space-y-6 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}