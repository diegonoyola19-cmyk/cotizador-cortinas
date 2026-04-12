import { FileText, Plus, Check, Send } from "lucide-react";
import { Panel, FilaResumen, ButtonPrimary, ButtonSecondary } from "./ui";
import { formatoDinero } from "../utils/helpers";

export function ResumenComercialPanel({ totales, datos, brand, catalogo, itemsCalculados, guardandoCotizacion, guardarCotizacionEnviada, limpiarCotizacion, generarPDFCotizacion }) {
  
  const handleLimpiar = () => {
    if (window.confirm("¿Estás seguro de que deseas limpiar todo el formulario y empezar de nuevo? Perderás los ítems no guardados.")) {
      limpiarCotizacion();
    }
  };

  const manejarGenerarPDF = async () => {
    try {
      await guardarCotizacionEnviada();
    } catch (error) {
      console.error("Error guardando al generar PDF:", error);
    }
    generarPDFCotizacion({ brand, catalogo, datos, itemsCalculados, totales });
  };

  const manejarWhatsAppProduccion = () => {
    let mensaje = `*ORDEN DE PRODUCCIÓN*\n`;
    if (datos.numeroCotizacion) mensaje += `🔖 Referencia: ${datos.numeroCotizacion}\n`;
    if (datos.cliente) mensaje += `👤 Cliente: ${datos.cliente}\n`;
    mensaje += `\n`;

    let contadorVisibles = 1;
    itemsCalculados.forEach((item) => {
      const producto = catalogo.find(p => p.id === item.catalogId);
      
      // Omitimos el iterador si detectamos la palabra "Instalacion" en su nombre o en la categoria
      const nombreParaFiltrar = `${producto?.nombre || ""} ${producto?.categoria || ""}`.toLowerCase();
      if (nombreParaFiltrar.includes("instalaci")) return;

      mensaje += `*${contadorVisibles}. ${producto?.nombre || "Ítem"}*\n`;
      if (item.usaMedidas) {
        mensaje += `📐 Ancho: ${item.ancho}m x Alto: ${item.alto}m\n`;
      } else {
        mensaje += `🔸 Cantidad: ${item.cantidad}\n`;
      }
      
      const lineaDetectada = producto?.lineaTonos || producto?.categoria || "";
      if (lineaDetectada) mensaje += `🏷 Línea/Tipo: ${lineaDetectada}\n`;
      if (item.observacion) mensaje += `📝 Notas: ${item.observacion}\n`;
      mensaje += `\n`;

      contadorVisibles++; // Asegura enumeracion 1, 2, 3 incluso si omitimos el item de instalación que podria ser el #2
    });

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="relative z-10 space-y-4 transition-all xl:sticky xl:top-4">
      <Panel 
        titulo="Resumen Comercial" 
        tone="highlight" 
        className="!rounded-[24px] !p-4 sm:!rounded-[28px] sm:!p-6 !border-white/10 !bg-gradient-to-br !from-slate-900 !to-slate-950 !shadow-[0_20px_40px_rgba(15,23,42,0.25)] relative overflow-hidden group"
      >
        {/* Decorative elements for WOW effect */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 opacity-50 blur-3xl transition-transform group-hover:scale-150" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-sky-500/10 opacity-50 blur-2xl transition-transform group-hover:scale-150" />
        
        <div className="relative z-10 rounded-[18px] border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md sm:rounded-[20px] sm:p-4">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Cierre de Cotización</p>
          <div className="space-y-2">
            <FilaResumen label="Subtotal" valor={formatoDinero(totales.subtotal)} />
            {totales.descuento > 0 && (
              <FilaResumen label={`Descuento (${datos.descuentoPorcentaje}%)`} valor={`-${formatoDinero(totales.descuento)}`} />
            )}
            <FilaResumen label="IVA" valor={formatoDinero(totales.iva)} />
            <div className="mt-4 border-t border-white/10 pt-4">
              <FilaResumen label="Total Final" valor={formatoDinero(totales.totalFinal)} fuerte />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 grid gap-2 sm:mt-5 sm:gap-2.5">
          <ButtonPrimary 
            onClick={manejarGenerarPDF} 
            color="#ffffff" 
            className="!h-11 !rounded-[16px] !text-slate-900 shadow-[0_12px_24px_rgba(255,255,255,0.12)] hover:!shadow-[0_16px_32px_rgba(255,255,255,0.18)] sm:!h-12 sm:!rounded-[18px]" 
            icon={<FileText size={18} className="text-slate-700" />}
          >
            Generar PDF Profesional
          </ButtonPrimary>
          <ButtonSecondary 
            onClick={manejarWhatsAppProduccion} 
            className="!h-11 !rounded-[16px] !border-[rgba(56,189,248,0.3)] !bg-[rgba(56,189,248,0.1)] !text-sky-300 hover:!bg-[rgba(56,189,248,0.2)] sm:!h-12 sm:!rounded-[18px]"
            icon={<Send size={16} />}
          >
            Enviar WhatsApp a Producción
          </ButtonSecondary>
          <ButtonSecondary 
            onClick={guardarCotizacionEnviada} 
            disabled={guardandoCotizacion} 
            className="!h-11 !rounded-[16px] !border-white/15 !bg-white/5 !text-white hover:!bg-white/10 sm:!h-12 sm:!rounded-[18px]"
            icon={guardandoCotizacion ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check size={16} />}
          >
            {guardandoCotizacion ? "Guardando en historial..." : "Guardar Cotización"}
          </ButtonSecondary>
          <ButtonSecondary 
            onClick={handleLimpiar} 
            icon={<Plus size={16} />} 
            className="!h-11 !rounded-[16px] !border-transparent !bg-transparent !text-white/60 hover:!bg-white/5 hover:!text-white sm:!h-12 sm:!rounded-[18px]"
          >
            Nueva Cotización
          </ButtonSecondary>
        </div>

        <div className="relative z-10 mt-4 rounded-[18px] border border-white/5 bg-white/[0.03] p-3.5 text-xs sm:mt-5 sm:rounded-[20px] sm:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80">
              <span className="font-serif italic font-bold">i</span>
            </div>
            <div className="text-white/60 leading-relaxed">
              <strong className="block text-white/85 font-semibold text-sm mb-0.5">Propuesta lista</strong>
              Revisa bien los ítems antes de proceder a generar PDF. En "Nueva Cotización" se vaciaran los valores actuales.
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
