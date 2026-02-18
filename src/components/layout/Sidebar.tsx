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
  LogOut,
  MapPin,
  ChevronDown,
  ChevronRight,
  Navigation2,
  Users
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";

interface NavItem {
  icon: any;
  label: string;
  href?: string;
  roles?: string[];
  subItems?: { label: string; href: string; icon: any }[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "City Monitor", href: "/" },
  { icon: BarChart3, label: "City Comparison", href: "/comparison" },
  { icon: LucideBanknote, label: "Finance & Budget", href: "/finance" },
  { icon: MapIcon, label: "GIS Layers", href: "/gis" },
  {
    icon: Navigation2,
    label: "Area Management",
    subItems: [
      { icon: MapPin, label: "Province", href: "/province-management" },
      { icon: MapPin, label: "Division", href: "/division-management" },
      { icon: MapPin, label: "District", href: "/district-management" },
      { icon: MapPin, label: "Tehsil", href: "/tehsil-management" },
    ]
  },
  { icon: Users, label: "Stakeholders", href: "/stakeholder-management" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole"));
  }, []);

  const visibleNavItems = NAV_ITEMS.filter(item =>
    !item.roles || (userRole && item.roles.includes(userRole))
  );

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
      <div className="flex-1 overflow-auto py-2 scrollbar-hide">
        <nav className="grid items-start px-4 text-sm font-medium space-y-1">
          {visibleNavItems.map((item) => (
            item.subItems ? (
              <Accordion type="single" collapsible key={item.label} className="w-full border-none">
                <AccordionItem value={item.label} className="border-none">
                  <AccordionTrigger className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-white/5 hover:no-underline text-white/80 hover:text-white [&[data-state=open]]:text-white font-sans tracking-normal",
                    item.subItems.some(sub => location === sub.href)
                      ? "bg-secondary text-white font-bold shadow-lg shadow-secondary/20"
                      : "[&[data-state=open]]:bg-white/5"
                  )}>
                    <div className="flex items-center gap-3 font-medium">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-1">
                    <div className="flex flex-col gap-0.5 pl-4 ml-3 border-l border-white/10">
                      {item.subItems.map((sub) => (
                        <Link key={sub.href} href={sub.href}>
                          <a
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-1.5 transition-all text-xs font-sans",
                              location === sub.href
                                ? "bg-secondary text-white font-bold shadow-lg shadow-secondary/20"
                                : "text-white/60 hover:bg-white/5 hover:text-white font-medium"
                            )}
                          >
                            <sub.icon className="h-3.5 w-3.5" />
                            {sub.label}
                          </a>
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <Link key={item.href} href={item.href!}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm font-medium font-sans",
                    location === item.href
                      ? "bg-secondary text-white font-bold shadow-lg shadow-secondary/20"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            )
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 p-4 mt-auto">
        <Link href="/auth">
          <a
            onClick={() => localStorage.removeItem("userRole")}
            className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-all group pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold border border-secondary/30">
                {userRole === "Client" ? "CL" : "AD"}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">{userRole === "Client" ? "Client Authority" : "Admin Officer"}</p>
                <p className="text-white/40 group-hover:text-white/60 transition-colors">{userRole === "Client" ? "Governance Wing" : "Command Center"}</p>
              </div>
            </div>
            <LogOut className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
          </a>
        </Link>
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