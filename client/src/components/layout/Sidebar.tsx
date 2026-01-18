import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Shield, 
  Activity, 
  BarChart3, 
  LucideBanknote, 
  LayoutDashboard, 
  Map as MapIcon, 
  Settings,
  Menu,
  
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "City Monitor", href: "/" },
  { icon: BarChart3, label: "Comparison", href: "/comparison" },
  { icon: LucideBanknote, label: "Finance & Budget", href: "/finance" },
  { icon: MapIcon, label: "GIS Layers", href: "/gis" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();

  const NavContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/">
          <a className="flex items-center gap-3 font-heading font-bold text-2xl text-white tracking-wide">
            <img 
              src="/Assets/psca logo.png" 
              alt="PSCA Logo" 
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col leading-none">
              <span>PSCA</span>
              <span className="text-[10px] text-white/50 font-medium tracking-tighter uppercase">Safe City Portal</span>
            </div>
          </a>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                  location === item.href
                    ? "bg-secondary text-white font-semibold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold border border-secondary/30">
            AD
          </div>
          <div className="text-xs">
            <p className="font-semibold text-white">Admin Officer</p>
            <p className="text-white/40">Command Center</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden border-r bg-sidebar md:block w-64 fixed inset-y-0 left-0 z-30 shadow-2xl">
        <NavContent />
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40 bg-card">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-none">
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
}