import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardList, History, Menu, Settings, Shield, X, Home, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useCotizadorState } from "./hooks/useCotizadorState";
import { CotizacionTab } from "./components/CotizacionTab";
import { AdminTab } from "./components/AdminTab";
import { AjustesTab } from "./components/AjustesTab";
import { EstadisticasTab } from "./components/EstadisticasTab";
import { HistorialTab } from "./components/HistorialTab";

export default function CotizadorCortinasWeb({ authProfile }) {
  const state = useCotizadorState(authProfile);
  const { tabActiva, setTabActiva } = state;
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (menuAbierto) {
      setMenuVisible(true);
      return;
    }

    if (!menuVisible) return;
    const timeout = window.setTimeout(() => setMenuVisible(false), 260);
    return () => window.clearTimeout(timeout);
  }, [menuAbierto, menuVisible]);

  const abrirMenu = () => {
    setMenuVisible(true);
    window.requestAnimationFrame(() => setMenuAbierto(true));
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  const opcionesMenu = useMemo(
    () => {
      const menu = [
        { id: "estadisticas", label: "Inicio (Dashboard)", icon: Home, description: "Centro de control y resumen" },
        { id: "cotizacion", label: "Cotización", icon: ClipboardList, description: "Calculadora de proyectos" },
        { id: "historial", label: "CRM Historial", icon: History, description: "Lista compacta y seguimientos" },
        { id: "ajustes", label: "Ajustes", icon: Settings, description: "Cerrar sistema y app" },
      ];
      if (authProfile?.role === "admin") {
        menu.splice(3, 0, { id: "admin", label: "Panel Admin", icon: Shield, description: "Catálogo, tonos e invitados" });
      }
      return menu;
    },
    [authProfile]
  );

  const vistaActual = opcionesMenu.find((opcion) => opcion.id === tabActiva) || opcionesMenu[0];

  const renderVista = () => {
    if (tabActiva === "cotizacion") return <CotizacionTab state={state} />;
    if (tabActiva === "historial") return <HistorialTab state={state} />;
    if (tabActiva === "estadisticas") return <EstadisticasTab state={state} />;
    if (tabActiva === "admin") return <AdminTab state={state} />;
    return <AjustesTab state={state} />;
  };

  return (
    <div className="min-h-screen p-3 font-sans text-slate-800 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 rounded-[30px] border border-slate-200/80 bg-white/92 px-4 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)] backdrop-blur-md sm:mb-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <button
                onClick={abrirMenu}
                className="inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-[1.15rem] border border-slate-200 bg-slate-50/80 px-3 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:bg-white hover:text-slate-900 sm:h-[4.75rem] sm:min-w-[4.75rem] sm:px-5 sm:text-base"
              >
                <Menu size={20} />
                <span className="hidden sm:inline">Menu</span>
              </button>

              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button onClick={() => setTabActiva("estadisticas")} className="text-left group transition-transform hover:scale-[1.02] active:scale-[0.98] outline-none flex items-center gap-3 sm:gap-4">
                  <img
                    src={state.brand.logo || "/logo-mec.jpg"}
                    alt="Logo MEC"
                    className="h-16 w-16 shrink-0 rounded-[1.3rem] object-cover shadow-[0_14px_28px_rgba(15,23,42,0.12)] sm:h-[5.5rem] sm:w-[5.5rem]"
                  />
                  <div className="min-w-0">
                    <h1 className="text-xl font-black tracking-[-0.05em] text-slate-950 sm:text-[2rem] group-hover:text-indigo-600 transition-colors">
                      {state.brand.empresa}
                    </h1>
                    {state.brand.slogan ? (
                      <p className="mt-1 text-left text-[10px] font-medium tracking-[0.14em] text-slate-400 sm:text-[11px] sm:tracking-[0.18em]">
                        {state.brand.slogan}
                      </p>
                    ) : null}
                  </div>
                </button>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-right lg:block">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400">Vista actual</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{vistaActual.label}</p>
            </div>
          </div>
        </div>

        <div className="min-w-0">


          {renderVista()}
        </div>

        {menuVisible && (
          <div className="fixed inset-0 z-50">
            <button
              onClick={cerrarMenu}
              className={`absolute inset-0 backdrop-blur-sm transition-all duration-250 ease-out ${
                menuAbierto ? "bg-slate-950/45 opacity-100" : "bg-slate-950/0 opacity-0"
              }`}
              aria-label="Cerrar menu"
            />
            <aside
              className={`absolute left-0 top-0 flex h-full w-[88vw] max-w-md flex-col border-r border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-5 ${
                menuAbierto ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
              }`}
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Navegacion</p>
                  <h2 className="text-lg font-bold text-white">{state.brand.empresa}</h2>
                </div>
                <button
                  onClick={cerrarMenu}
                  className="rounded-2xl border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  aria-label="Cerrar menu"
                >
                  <X size={18} />
                </button>
              </div>

              <MenuSidebar
                opciones={opcionesMenu}
                activa={tabActiva}
                abierta={menuAbierto}
                onSelect={(tab) => {
                  setTabActiva(tab);
                  cerrarMenu();
                }}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuSidebar({ opciones, activa, abierta, onSelect }) {
  return (
    <>
      <div className={`mb-2 border-b border-slate-800 pb-4 transition-all duration-300 ${abierta ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Navegacion</p>
        <h2 className="mt-2 text-lg font-bold text-white">Accesos del sistema</h2>
      </div>

      <nav className="space-y-2 mt-4 flex-1">
        {opciones.map((opcion) => {
          const Icono = opcion.icon;
          const estaActiva = opcion.id === activa;

          return (
            <button
              key={opcion.id}
              onClick={() => onSelect(opcion.id)}
              style={{ transitionDelay: abierta ? `${70 + opciones.indexOf(opcion) * 40}ms` : "0ms" }}
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                estaActiva
                  ? "scale-[1.02] border-sky-400/30 bg-sky-500/15 text-white shadow-lg shadow-sky-950/20"
                  : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:scale-[1.01]"
              } ${abierta ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
            >
              <span className={`mt-0.5 rounded-xl p-2.5 ${estaActiva ? "bg-sky-400/20 text-sky-200" : "bg-slate-800 text-slate-300"}`}>
                <Icono size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold">{opcion.label}</span>
                <span className={`mt-1 block text-sm ${estaActiva ? "text-sky-100/80" : "text-slate-400"}`}>
                  {opcion.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className={`mt-auto pt-6 pb-2 transition-all duration-300 ${abierta ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={{ transitionDelay: abierta ? "300ms" : "0ms" }}>
        <button 
           onClick={() => {
              if (window.confirm("¿Seguro que deseas salir del sistema?")) {
                 supabase.auth.signOut();
              }
           }}
           className="flex w-full items-center gap-3 rounded-2xl border border-red-900/30 px-4 py-4 text-left transition bg-red-950/20 text-red-400 hover:border-red-800 hover:bg-red-900/40 hover:text-red-300"
        >
           <span className="rounded-xl p-2.5 bg-red-900/40 text-red-400"><LogOut size={20} /></span>
           <span className="min-w-0 block text-base font-semibold">Cerrar Sesión Fuerte</span>
        </button>
      </div>
    </>
  );
}
