import React, { useState, useMemo } from "react";
import { Check, Copy, MessageCircle, RefreshCw, Trash2, X } from "lucide-react";
import { formatoDinero, calcularDiasTranscurridos } from "../utils/helpers";
import { generateFollowUpMessage } from "../utils/aiService";
import { ButtonSecondary, Campo, CheckboxField, Panel, Vacio } from "./ui";

const ESTATUS_OPCIONES = [
  { id: "pendiente", label: "🟡 Pendiente", colorFondo: "bg-amber-50 dark:bg-amber-900/20", colorBorde: "border-amber-200 dark:border-amber-800" },
  { id: "aprobada", label: "🟢 Aprobada", colorFondo: "bg-emerald-50 dark:bg-emerald-900/20", colorBorde: "border-emerald-200 dark:border-emerald-800" },
  { id: "perdida", label: "🔴 Perdida", colorFondo: "bg-red-50 dark:bg-red-900/20", colorBorde: "border-red-200 dark:border-red-800" }
];

export function HistorialTab({ state }) {
  const [iaTargetRegistro, setIaTargetRegistro] = useState(null);
  const [generandoMensaje, setGenerandoMensaje] = useState(false);
  const [mensajeGenerado, setMensajeGenerado] = useState(null);
  const [errorAI, setErrorAI] = useState("");
  
  const {
    cargandoAdmin,
    cargarPanelAdministrativo,
    cotizacionesFiltradas,
    filtroAdmin,
    setFiltroAdmin,
    filtroEstatusHistorial,
    setFiltroEstatusHistorial,
    cotizacionSeleccionadaId,
    mensajeAdmin,
    cargarCotizacionGuardada,
    eliminarCotizacionGuardada,
    actualizarEstatusCRM,
    toggleMedidasConfirmadasCRM
  } = state;

  const handleGenerarMensaje = async (registro, tipo) => {
    setGenerandoMensaje(true);
    setErrorAI("");
    try {
      const texto = await generateFollowUpMessage(registro.quote, registro.totals, state.brand.geminiApiKey, tipo);
      setIaTargetRegistro(null);
      setMensajeGenerado({ id: registro.id, texto, copiado: false });
    } catch (error) {
      setErrorAI(error.message);
    } finally {
      setGenerandoMensaje(false);
    }
  };

  const registrosVista = useMemo(() => {
    if (filtroEstatusHistorial === "todos") return cotizacionesFiltradas;
    return cotizacionesFiltradas.filter((c) => {
       const statusGenuino = c.status === "enviada" ? "pendiente" : (c.status || "pendiente");
       return statusGenuino === filtroEstatusHistorial;
    });
  }, [cotizacionesFiltradas, filtroEstatusHistorial]);

  return (
    <div className="mt-4 flex min-h-0 flex-col space-y-4 anim-fade-in xl:h-full xl:max-h-[calc(100vh-100px)]">
      <Panel titulo="Centro de Negocios (Lista Compacta)" className="flex-shrink-0 !pb-2">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Campo label="Búsqueda global (Cliente o Folio)" value={filtroAdmin} onChange={setFiltroAdmin} inputClassName="!h-9" />
          <ButtonSecondary onClick={cargarPanelAdministrativo} disabled={cargandoAdmin} icon={<RefreshCw size={14} className={cargandoAdmin ? "animate-spin" : ""} />} className="!h-9 dark:!bg-slate-800 dark:!text-slate-200 dark:!border-slate-700">
            {cargandoAdmin ? "Sincronizando..." : "Sincronizar"}
          </ButtonSecondary>
        </div>

        {mensajeAdmin && (
          <div className="mt-3 rounded-md bg-indigo-50/80 p-2 text-xs font-medium text-indigo-700 shadow-sm border border-indigo-100">
            {mensajeAdmin}
          </div>
        )}

        <div className="mt-4 flex overflow-x-auto custom-scrollbar pb-2 gap-2 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setFiltroEstatusHistorial("todos")}
            className={`px-4 py-1.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${filtroEstatusHistorial === "todos" ? "border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            📋 Todos ({cotizacionesFiltradas.length})
          </button>
          
          {ESTATUS_OPCIONES.map(opt => {
            const conteo = cotizacionesFiltradas.filter(c => (c.status === "enviada" ? "pendiente" : (c.status || "pendiente")) === opt.id).length;
            const Activo = filtroEstatusHistorial === opt.id;
            return (
              <button 
                key={opt.id}
                onClick={() => setFiltroEstatusHistorial(opt.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex gap-1 ${Activo ? "border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200" : "border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"}`}
              >
                <span>{opt.label.split(" ")[0]}</span> 
                <span>{opt.label.split(" ")[1]} ({conteo})</span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* CONTENEDOR CON SCROLL ENJAULADO */}
      <div className="flex-1 overflow-visible pb-10 xl:overflow-y-auto xl:pr-2 custom-scrollbar">
        <div className="space-y-2">
          {registrosVista.length > 0 ? (
            registrosVista.map((registro) => {
              const dias = calcularDiasTranscurridos(registro.quote?.fecha || registro.created_at);
              const isSeleccionada = cotizacionSeleccionadaId === registro.id;
              const statusActual = registro.status === "enviada" ? "pendiente" : (registro.status || "pendiente");
              const configStatus = ESTATUS_OPCIONES.find(o => o.id === statusActual) || ESTATUS_OPCIONES[0];

              return (
                <div
                  key={registro.id}
                  className={`flex flex-col items-stretch justify-between gap-3 rounded-xl border p-3 transition-colors xl:flex-row xl:items-center ${configStatus.colorFondo} ${configStatus.colorBorde} ${isSeleccionada ? "ring-2 ring-indigo-400 bg-white dark:bg-slate-800 shadow-md" : "hover:bg-white dark:hover:bg-slate-800/80"}`}
                >
                  {/* SECCION 1: INFO GENERAL */}
                  <div className="flex min-w-0 flex-1 flex-col">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{registro.quote?.numeroCotizacion || "S/Folio"}</span>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate" title={registro.quote?.cliente}>{registro.quote?.cliente || "Desconocido"}</h4>
                     </div>
                     <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span title={registro.quote?.fecha}>Hace {dias === 0 ? "hoy" : dias === 1 ? "1 dia" : `${dias} dias`}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[120px]">Asesor: {registro.quote?.vendedor || "-"}</span>
                     </div>
                  </div>

                  {/* SECCION 2: ESTATUS Y MEDIDAS (CONTROLES AGILES) */}
                  <div className="flex flex-col gap-3 border-y border-slate-200/50 py-2 dark:border-slate-700/50 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap xl:border-y-0 xl:py-0">
                     <div className="flex w-full flex-col sm:w-[130px]">
                        <select 
                          value={statusActual}
                          onChange={(e) => actualizarEstatusCRM(registro.id, e.target.value)}
                          className={`w-full h-8 px-2 text-xs font-bold border rounded-lg cursor-pointer outline-none ${configStatus.colorBorde} bg-white dark:bg-slate-900 shadow-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700`}
                        >
                          {ESTATUS_OPCIONES.map(opt => (
                             <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                        </select>
                     </div>
                     
                     <div className="flex min-h-8 items-center px-1">
                       <CheckboxField
                         label={<span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 pl-1 uppercase tracking-wider">Medidas Conf.</span>}
                         checked={registro.quote?.medidasConfirmadas || false}
                         onChange={() => toggleMedidasConfirmadasCRM(registro.id, registro.quote?.medidasConfirmadas)}
                         className="!mb-0"
                       />
                     </div>
                  </div>

                  {/* SECCION 3: TOTAL Y BOTONES */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:justify-end xl:gap-3 xl:flex-shrink-0">
                     <div className="flex min-w-[90px] flex-col sm:items-start xl:items-end text-sm font-extrabold text-slate-800 dark:text-slate-100">
                       <span className="text-[9px] uppercase text-slate-400 dark:text-slate-500 font-bold mb-[1px]">Total</span>
                       {formatoDinero(registro.totals?.totalFinal || 0)}
                     </div>

                     <div className="flex items-center justify-end gap-1.5 border-t border-slate-200/60 pt-3 dark:border-slate-700/60 sm:border-t-0 sm:pt-0 xl:ml-2 xl:border-l xl:pl-3">
                        <button 
                          onClick={() => setIaTargetRegistro(registro)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-sm"
                          title="IA Seguimiento"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button 
                          onClick={() => cargarCotizacionGuardada(registro)}
                          className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/30 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-sm"
                        >
                          <span>Ver</span> <span className="hidden sm:inline"> / Editar</span>
                        </button>
                        <button 
                          onClick={() => eliminarCotizacionGuardada(registro.id)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 transition-colors shadow-sm"
                          title="Borrar"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Vacio mensaje="No hay cotizaciones para mostrar con este filtro." />
          )}
        </div>
      </div>

      {/* MODALES DE IA */}
      {iaTargetRegistro && !mensajeGenerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm anim-fade-in">
          <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-emerald-100 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between bg-emerald-600 dark:bg-emerald-700 p-4 text-white">
              <div className="flex items-center gap-2 font-bold">
                <MessageCircle size={20} />
                Generador IA
              </div>
              <button disabled={generandoMensaje} onClick={() => setIaTargetRegistro(null)} className="hover:text-emerald-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Que clase de mensaje deseas redactar sobre la cotizacion?</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">{iaTargetRegistro.quote?.cliente}</p>
              </div>

              <div className="space-y-2">
                <ButtonSecondary
                  disabled={generandoMensaje}
                  onClick={() => handleGenerarMensaje(iaTargetRegistro, "envio")}
                  className="w-full !justify-start !bg-slate-50 dark:!bg-slate-800 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:!bg-slate-100 dark:hover:!bg-slate-700"
                >
                  Entrega inicial de cotizacion
                </ButtonSecondary>

                <ButtonSecondary
                  disabled={generandoMensaje}
                  onClick={() => handleGenerarMensaje(iaTargetRegistro, "seguimiento")}
                  className="w-full !justify-start !bg-emerald-50 py-3 text-left text-sm font-bold !text-emerald-800 hover:!bg-emerald-100 border-emerald-200"
                >
                  Seguimiento de venta
                </ButtonSecondary>
              </div>
            </div>

            {generandoMensaje && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 font-bold text-emerald-700 backdrop-blur-sm">
                <MessageCircle size={32} className="mb-2 animate-bounce" />
                Redactando...
              </div>
            )}
          </div>
        </div>
      )}

      {mensajeGenerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm anim-fade-in">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between bg-emerald-600 dark:bg-emerald-700 p-4 text-white">
              <div className="flex items-center gap-2 font-bold">
                <MessageCircle size={20} />
                Mensaje Generado por IA
              </div>
              <button onClick={() => setMensajeGenerado(null)} className="hover:text-emerald-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">La IA redacto este mensaje basandose en la cotizacion. Copialo y envialo por WhatsApp o correo.</p>
              <div className="whitespace-pre-wrap rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 p-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                {mensajeGenerado.texto}
              </div>
            </div>
            <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 sm:flex-row">
              <ButtonSecondary onClick={() => setMensajeGenerado(null)} className="w-full sm:w-auto">Cerrar</ButtonSecondary>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mensajeGenerado.texto);
                  setMensajeGenerado((prev) => ({ ...prev, copiado: true }));
                  setTimeout(() => setMensajeGenerado((prev) => (prev ? { ...prev, copiado: false } : null)), 2000);
                }}
                className="flex w-full min-w-[140px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 sm:w-auto"
              >
                {mensajeGenerado.copiado ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar mensaje</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorAI && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-xs items-center justify-between gap-4 rounded-xl bg-red-600 p-4 text-sm font-medium text-white shadow-lg anim-fade-in">
          <span>{errorAI}</span>
          <button onClick={() => setErrorAI("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
