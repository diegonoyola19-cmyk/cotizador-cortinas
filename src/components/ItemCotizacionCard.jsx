import { Trash2, Copy } from "lucide-react";
import { Campo, CajaResumen } from "./ui";
import { formatoDinero } from "../utils/helpers";

const detectarLineaTonos = (item, catalogo) => {
  const producto = catalogo.find((entry) => entry.id === item.catalogId);
  if (producto?.lineaTonos) return producto.lineaTonos;
  const texto = `${producto?.nombre || ""} ${producto?.categoria || ""}`.toLowerCase();
  
  if (texto.includes("blackout") || texto.includes("black out")) return "Blackout";
  if (texto.includes("screen")) return "Screen";
  if (texto.includes("attos") || texto.includes("exterior") || texto.includes("atos")) return "Exterior / ATOS";
  return "";
};

export function ItemCotizacionCard({ index, item, calculado, catalogo, actualizarItem, eliminarItem, clonarItem }) {
  const lineaSugerida = detectarLineaTonos(item, catalogo);
  const cantidadTonos = Array.isArray(item.tonosSeleccionados) ? item.tonosSeleccionados.length : 0;

  return (
    <div className="group rounded-[16px] border border-slate-200 bg-slate-50/60 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all hover:bg-white hover:shadow-md sm:p-3 anim-fade-in relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-slate-300 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
              {index + 1}
            </span>
            Ítem
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => clonarItem(index)}
            className="rounded-xl border border-sky-100 bg-white p-1.5 text-sky-500 transition-all hover:bg-sky-50 hover:text-sky-700 hover:scale-[1.05] active:scale-95" 
            title="Clonar item"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={() => {
              if (window.confirm(`¿Estás seguro de eliminar el Ítem ${index + 1}?`)) {
                eliminarItem(index);
              }
            }} 
            className="rounded-xl border border-red-100 bg-white p-1.5 text-red-500 transition-all hover:bg-red-50 hover:text-red-700 hover:scale-[1.05] active:scale-95" 
            title="Eliminar item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-6 lg:grid-cols-8">
        <div className="sm:col-span-3 lg:col-span-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Producto</label>
          <select
            value={item.catalogId}
            onChange={(e) => actualizarItem(index, "catalogId", e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] transition-all focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
          >
            {catalogo.map((producto) => (
              <option key={producto.id} value={producto.id}>{producto.nombre}</option>
            ))}
          </select>
        </div>

        <Campo label="Cant." type="number" inputProps={{ step: "1" }} value={item.cantidad} onChange={(v) => actualizarItem(index, "cantidad", v)} className="sm:col-span-1 lg:col-span-1" inputClassName="h-9 px-2.5 text-xs font-semibold" labelClassName="!mb-1 !text-[10px] !uppercase" />

        {item.usaMedidas ? (
          <>
            <Campo label="Ancho" type="number" value={item.ancho} onChange={(v) => actualizarItem(index, "ancho", v)} className="sm:col-span-1 lg:col-span-1" inputClassName="h-9 px-2.5 text-xs" labelClassName="!mb-1 !text-[10px] !uppercase" />
            <Campo label="Alto" type="number" value={item.alto} onChange={(v) => actualizarItem(index, "alto", v)} className="sm:col-span-1 lg:col-span-1" inputClassName="h-9 px-2.5 text-xs" labelClassName="!mb-1 !text-[10px] !uppercase" />
          </>
        ) : (
          <div className="sm:col-span-2 lg:col-span-2 flex items-end">
            <div className="flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-400">
              Medidas no aplican
            </div>
          </div>
        )}

        <Campo
          label={item.usaMedidas ? "Precio base (m2)" : "Precio base (Und)"}
          type="number"
          value={item.precio}
          onChange={(v) => actualizarItem(index, "precio", v)}
          className="sm:col-span-2 lg:col-span-2"
          inputClassName="h-9 px-2.5 text-xs text-sky-800 font-bold"
          labelClassName="!mb-1 !text-[10px] !uppercase text-sky-700"
        />

        <Campo label="Observación del cliente" value={item.observacion} onChange={(v) => actualizarItem(index, "observacion", v)} className="sm:col-span-6 lg:col-span-8" inputClassName="h-9 px-2.5 text-xs" labelClassName="!mb-1 !text-[10px] !uppercase" />

        <div className="sm:col-span-6 lg:col-span-8 rounded-[12px] border border-slate-200 bg-slate-100/50 px-3 py-2 transition-colors group-hover:bg-slate-50">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="font-bold uppercase tracking-[0.08em] text-slate-400">Tonos sugeridos:</span>
            {lineaSugerida ? (
              <>
                <span className="rounded-full bg-white px-2 py-0.5 font-bold text-slate-700 shadow-sm border border-slate-200">
                  {lineaSugerida}
                </span>
                <span>
                  {cantidadTonos > 0
                    ? `${cantidadTonos} tono(s) disponibles se agregarán automáticamente al PDF.`
                    : "No hay tonos cargados para esta línea."}
                </span>
              </>
            ) : (
              <span>Este producto no tiene una línea de tonos definida.</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
        <CajaResumen label="Área real" valor={item.usaMedidas ? `${calculado.areaReal.toFixed(2)} m2` : "-"} color="rgba(248, 250, 252, 0.8)" />
        <CajaResumen label="Ancho fact." valor={item.usaMedidas ? `${calculado.anchoFacturable.toFixed(2)} m` : "-"} color="rgba(248, 250, 252, 0.8)" />
        <CajaResumen label="Alto fact." valor={item.usaMedidas ? `${calculado.altoFacturable.toFixed(2)} m` : "-"} color="rgba(248, 250, 252, 0.8)" />
        <CajaResumen label="Área fact." valor={item.usaMedidas ? `${calculado.areaFacturable.toFixed(2)} m2` : "-"} color="rgba(248, 250, 252, 0.8)" />
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-3 py-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-sky-50">
          <div className="text-[10px] font-bold tracking-[0.12em] text-sky-600 uppercase">Subtotal del Ítem</div>
          <div className="mt-1 flex items-baseline gap-1 text-[1.1rem] font-bold tracking-[-0.01em] text-sky-900">
            <span className="text-sm font-semibold text-sky-700">$</span>
            <span>{formatoDinero(calculado.total).replace("$", "")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
