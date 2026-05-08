import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  Briefcase,
  Cog,
  FileText,
  Gavel,
  Home,
  LayoutGrid,
  RefreshCcw,
  Truck,
} from "lucide-react";
import { useTour } from "../tour/TourController";
import { reseed } from "../mock/seed";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/buyer", label: "Comprador", icon: Briefcase },
  { to: "/marketplace", label: "Fornecedor", icon: LayoutGrid },
  { to: "/admin", label: "Admin", icon: Cog },
];

export default function Layout() {
  const tour = useTour();
  const location = useLocation();

  async function handleReset() {
    if (!confirm("Resetar todos os dados do demo?")) return;
    await reseed();
    location.pathname !== "/" && (window.location.hash = "");
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-steel-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-steel-700 to-steel-950 flex items-center justify-center shadow-md">
              <BadgeCheck className="w-5 h-5 text-molten-400" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-steel-900">Steel Connect</div>
              <div className="text-[10px] text-steel-500 uppercase tracking-wider font-semibold">
                POC · Demo
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                data-tour={`nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-steel-900 text-white"
                      : "text-steel-700 hover:bg-steel-100"
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {!tour.state.active && (
              <button
                onClick={() => tour.start()}
                className="btn-primary"
                data-tour="start-tour"
              >
                <Activity className="w-3.5 h-3.5" />
                Iniciar tour de 60s
              </button>
            )}
            <button
              onClick={handleReset}
              className="btn-ghost"
              title="Resetar demo"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-steel-200/70 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-xs text-steel-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gavel className="w-3 h-3" /> POC client-side · escrow simulado · Web Crypto AES-256-GCM
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" /> Logística offline-first
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> FSM contratual normativa
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
