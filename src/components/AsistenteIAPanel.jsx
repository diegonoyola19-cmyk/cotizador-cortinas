import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { parseWhatsAppToItems } from "../utils/aiService";
import { ButtonSecondary } from "./ui";

export function AsistenteIAPanel({ visible, setVisible, brand, catalogo, setItems }) {
  const [textoMagico, setTextoMagico] = useState("");
  const [notasMagico, setNotasMagico] = useState("");
  const [procesandoAI, setProcesandoAI] = useState(false);
  const [errorAI, setErrorAI] = useState("");

  if (!visible) return null;

  const procesarTexto = async () => {
    if (!textoMagico.trim()) return;
    setProcesandoAI(true);
    setErrorAI("");
    try {
      const itemsParseados = await parseWhatsAppToItems(textoMagico, brand.geminiApiKey, { notas: notasMagico });

      const nuevosItems = itemsParseados.map((parsed) => {
        const catProd = catalogo.find((c) => c.nombre.toLowerCase().includes((parsed.tipo || "").toLowerCase())) || catalogo[0];
        return {
          catalogId: catProd.id,
          descripcion: parsed.tipo || catProd.nombre,
          cantidad: Number(parsed.cantidad) || 1,
          ancho: Number(parsed.ancho) || 1,
          alto: Number(parsed.alto) || 1,
          precio: catProd.precio,
          usaMedidas: catProd.usaMedidas,
          observacion: `${parsed.ubicacion ? "Ubicacion: " + parsed.ubicacion : ""} ${parsed.detalles || ""}`.trim()
        };
      });

      setItems((prev) => [...prev, ...nuevosItems]);
      cerrarModal();
      setTextoMagico("");
      setNotasMagico("");
    } catch (err) {
      setErrorAI(err.message);
    } finally {
      setProcesandoAI(false);
    }
  };

  const cerrarModal = () => {
    if (!procesandoAI) setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity" onClick={cerrarModal} />
      
      <div className="relative max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-[32px] border border-white/20 bg-white/95 shadow-[0_32px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-200/60 bg-white/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
              <Sparkles size={24} className={procesandoAI ? "animate-pulse" : ""} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Asistente de llenado con IA</h2>
              <p className="text-sm font-medium text-slate-500">Pega el mensaje crudo del cliente, nosotros hacemos el resto.</p>
            </div>
          </div>
          <button disabled={procesandoAI} onClick={cerrarModal} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6 sm:p-8">
          {errorAI && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm flex items-start gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold shrink-0">!</span>
              {errorAI}
            </div>
          )}

          <div>
            <label className="mb-2.5 block text-sm font-bold text-slate-700">Contexto u opciones adicionales (opcional)</label>
            <input
              type="text"
              placeholder="Ej: Asume que todas son Blackout manuales"
              className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)] transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
              value={notasMagico}
              onChange={(e) => setNotasMagico(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2.5 block text-sm font-bold text-slate-700">Mensaje de WhatsApp con las medidas</label>
            <textarea
              className="min-h-[240px] w-full rounded-[20px] border border-slate-200 bg-slate-50/50 p-5 text-sm font-medium text-slate-800 shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)] transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 resize-y"
              placeholder="1- 230 ancho x314 alto recamara principal&#10;2- 230x290&#10;3- 136x130..."
              value={textoMagico}
              onChange={(e) => setTextoMagico(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50/80 p-5 sm:flex-row sm:px-8 sm:py-6">
          <ButtonSecondary onClick={cerrarModal} disabled={procesandoAI} className="w-full h-12 rounded-[18px] sm:w-auto">Cancelar</ButtonSecondary>
          <button
            onClick={procesarTexto}
            disabled={procesandoAI || !textoMagico.trim()}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[18px] bg-emerald-600 px-6 text-sm font-bold text-white shadow-[0_12px_24px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-[0_16px_32px_rgba(16,185,129,0.3)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
          >
            {procesandoAI ? (
              <span className="flex items-center gap-2">
                <Sparkles size={18} className="animate-spin" /> Procesando con IA...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={18} className="transition-transform group-hover:rotate-12 group-hover:scale-110" />
                Extraer e Insertar Ítems
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
