import React, { useState, useMemo } from "react";
import { RefreshCw, TrendingUp, CheckCircle, Target, Users, PieChart, Sparkles, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Panel, ButtonPrimary, ButtonSecondary, Vacio } from "./ui";
import { formatoDinero } from "../utils/helpers";
import { analyzeBusinessStats } from "../utils/aiService";

export function EstadisticasTab({ state }) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const [analisisAI, setAnalisisAI] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [errorAI, setErrorAI] = useState("");

  const ejecutarAnalista = async () => {
    if (!state.cotizacionesGuardadas || state.cotizacionesGuardadas.length === 0) return;
    setAnalizando(true);
    setErrorAI("");
    try {
      const resp = await analyzeBusinessStats(state.cotizacionesGuardadas, state.brand.geminiApiKey);
      setAnalisisAI(resp);
    } catch (err) {
      setErrorAI(err.message);
    } finally {
      setAnalizando(false);
    }
  };

  const {
    brand,
    cotizacionesGuardadas,
    cargandoAdmin,
    cargarPanelAdministrativo
  } = state;

  const [vendedorFiltro, setVendedorFiltro] = useState("Todos");

  // Procesamiento de datos basado en el historial cargado en el administrador
  const metricas = useMemo(() => {
    let filtradas = cotizacionesGuardadas || [];
    
    if (vendedorFiltro !== "Todos") {
      filtradas = filtradas.filter(c => c.quote?.vendedor === vendedorFiltro || (vendedorFiltro === "Sin Vendedor" && !c.quote?.vendedor));
    }

    const aprobadas = filtradas.filter(c => c.status === "aprobada");
    const pendientes = filtradas.filter(c => c.status === "pendiente" || c.status === "enviada");
    
    const totalEnviadas = filtradas.length;
    const totalAprobadas = aprobadas.length;
    const casosAbiertos = pendientes.length;
    
    const tasaAprobacion = totalEnviadas > 0 ? Math.round((totalAprobadas / totalEnviadas) * 100) : 0;
    
    const dineroCerrado = aprobadas.reduce((sum, c) => sum + (c.totals?.totalFinal || 0), 0);
    const dineroLimbo = pendientes.reduce((sum, c) => sum + (c.totals?.totalFinal || 0), 0);
    const visitasPendientes = [...aprobadas, ...pendientes].filter(c => !c.quote?.medidasConfirmadas).length;

    // Agrupación para gráfico de barras (Aprobadas vs Enviadas por Vendedor)
    let resumenPorVendedor = {};
    (cotizacionesGuardadas || []).forEach(c => {
      const vend = c.quote?.vendedor || "Sin Vendedor";
      if (!resumenPorVendedor[vend]) {
        resumenPorVendedor[vend] = { nombre: vend, cotizadas: 0, aprobadas: 0, dineroCerrado: 0 };
      }
      resumenPorVendedor[vend].cotizadas += 1;
      if (c.status === "aprobada") {
        resumenPorVendedor[vend].aprobadas += 1;
        resumenPorVendedor[vend].dineroCerrado += (c.totals?.totalFinal || 0);
      }
    });

    const chartData = Object.values(resumenPorVendedor).sort((a,b) => b.cotizadas - a.cotizadas);

    return { totalEnviadas, totalAprobadas, casosAbiertos, dineroCerrado, dineroLimbo, visitasPendientes, chartData };
  }, [cotizacionesGuardadas, vendedorFiltro]);

  const llevarAHistorial = (estatusDeseado) => {
    state.setFiltroAdmin(vendedorFiltro === "Todos" ? "" : vendedorFiltro);
    state.setFiltroEstatusHistorial(estatusDeseado);
    state.setTabActiva("historial");
  };

  return (
    <div className="mt-4 space-y-6 anim-fade-in">
      <div className="mb-2 px-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{saludo}, equipo.</h2>
        <p className="text-sm font-medium text-slate-500">Aquí está el resumen financiero actualizado al momento.</p>
      </div>

      <Panel titulo="Centro de Mando y Estadísticas">
        
        {/* Controles Top */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <ButtonSecondary 
              onClick={cargarPanelAdministrativo} 
              disabled={cargandoAdmin || analizando} 
              icon={<RefreshCw size={16} className={cargandoAdmin ? "animate-spin" : ""} />}
            >
              {cargandoAdmin ? "Sincronizando..." : "Extraer Nube"}
            </ButtonSecondary>

            <ButtonSecondary 
              onClick={ejecutarAnalista} 
              disabled={cargandoAdmin || analizando || !cotizacionesGuardadas?.length} 
              className="!bg-indigo-50 !text-indigo-700 hover:!bg-indigo-100 border border-indigo-200"
              icon={<Sparkles size={16} />}
            >
               {analizando ? "Analizando..." : "Analista de Negocio (IA)"}
            </ButtonSecondary>
            
            <div className="flex w-full flex-col sm:w-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-0.5">Filtrar Vendedor:</span>
              <select 
                className="h-9 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none sm:min-w-[200px]"
                value={vendedorFiltro}
                onChange={(e) => setVendedorFiltro(e.target.value)}
              >
                <option value="Todos">Global (Toda la Empresa)</option>
                {(brand.vendedores || []).map(v => (
                  <option key={v.id} value={v.nombre}>{v.nombre}</option>
                ))}
                <option value="Sin Vendedor">Sin Vendedor Asignado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard onClick={() => llevarAHistorial("aprobada")} icon={<TrendingUp size={20} />} title="Capital Ganado" value={formatoDinero(metricas.dineroCerrado)} subtitle={`${metricas.totalAprobadas} ventas ganadas`} color="emerald" isHighlight />
          <KpiCard onClick={() => llevarAHistorial("pendiente")} icon={<PieChart size={20} />} title="Dinero en Seguimiento" value={formatoDinero(metricas.dineroLimbo)} subtitle="Capital en negociación" color="indigo" />
          <KpiCard onClick={() => llevarAHistorial("pendiente")} icon={<Target size={20} />} title="Casos Abiertos" value={metricas.casosAbiertos} subtitle="Cotizaciones pendientes" color="blue" />
          <KpiCard onClick={() => llevarAHistorial("todos")} icon={<CheckCircle size={20} />} title="Visitas Pendientes" value={metricas.visitasPendientes} subtitle="Revisar lista completa" color="blue" />
        </div>

        {/* Gráficos */}
        {metricas.chartData.length > 0 ? (
           <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 shadow-sm sm:p-5">
             <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Users size={16} className="text-indigo-500"/>
               Desempeño por Asesor Comercial
             </h3>
             <div className="overflow-x-auto pb-2 custom-scrollbar">
               <div className="h-[300px] min-w-[560px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={metricas.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                     <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                     <Tooltip 
                       cursor={{fill: 'rgba(226, 232, 240, 0.4)'}} 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                     />
                     <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                     <Bar name="Presentadas" dataKey="cotizadas" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={30} />
                     <Bar name="Ganadas" dataKey="aprobadas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>
           </div>
        ) : (
          <Vacio mensaje="No hay datos registrados aún. Haz clic en 'Extraer Historial Nube' para calcular las estadísticas." />
        )}
      </Panel>

      {analisisAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 anim-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-indigo-600 p-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl text-white">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Análisis de Negocio (Asesor IA)</h2>
                  <p className="text-xs text-indigo-100 font-medium mt-0.5">Basado en todo tu historial de ventas</p>
                </div>
              </div>
              <button disabled={analizando} onClick={() => setAnalisisAI("")} className="hover:text-indigo-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto w-full custom-scrollbar text-sm text-slate-700 font-medium space-y-4" dangerouslySetInnerHTML={{ __html: analisisAI }} />
             
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <ButtonSecondary onClick={() => setAnalisisAI("")}>Entendido, cerrar</ButtonSecondary>
            </div>
            <style>{`
              .custom-scrollbar ul { list-style: disc; margin-left: 20px; }
              .custom-scrollbar h3 { font-size: 16px; font-weight: bold; color: #1e293b; margin-top: 10px; margin-bottom: 5px; }
              .custom-scrollbar b, .custom-scrollbar strong { font-weight: bold; color: #0f172a; }
            `}</style>
          </div>
        </div>
      )}

      {errorAI && (
         <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-4 rounded-xl shadow-lg font-medium text-sm flex justify-between items-center gap-4 max-w-xs anim-fade-in">
           <span>{errorAI}</span>
           <button onClick={() => setErrorAI("")}><X size={16}/></button>
         </div>
      )}
    </div>
  );
}

// Subcomponente local para los KPI
function KpiCard({ title, value, subtitle, icon, color, isHighlight, onClick }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  const bgStyle = isHighlight 
    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30" 
    : "bg-white border-slate-200 text-slate-800";

  const subStyle = isHighlight ? "text-emerald-100" : "text-slate-500";
  const iconStyle = isHighlight ? "bg-white/20 text-white" : colorMap[color];
  const pointerProps = onClick ? "cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98] outline-none text-left shadow-sm hover:shadow-md block w-full focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2" : "text-left";
  const Element = onClick ? "button" : "div";

  return (
    <Element onClick={onClick} className={`rounded-xl border p-4 ${pointerProps} ${bgStyle}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${isHighlight ? 'text-emerald-50' : 'text-slate-500'}`}>{title}</h4>
        <div className={`p-1.5 rounded-lg ${iconStyle}`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl sm:text-3xl font-black tracking-tight mb-1 ${isHighlight ? 'text-white' : 'text-slate-800'}`}>
        {value}
      </div>
      <div className={`text-xs font-medium ${subStyle}`}>
        {subtitle}
      </div>
    </Element>
  );
}
