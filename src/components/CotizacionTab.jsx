import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Panel, Campo, ButtonPrimary, ButtonSecondary } from "./ui";
import { ItemCotizacionCard } from "./ItemCotizacionCard";
import { AsistenteIAPanel } from "./AsistenteIAPanel";
import { ResumenComercialPanel } from "./ResumenComercialPanel";
import { generarPDFCotizacion } from "../utils/pdfGenerator";

export function CotizacionTab({ state }) {
  const [modalMagico, setModalMagico] = useState(false);

  const {
    brand,
    catalogo,
    datos, actualizarDato,
    items, actualizarItem, agregarItem, eliminarItem, clonarItem,
    limpiarCotizacion,
    guardandoCotizacion, guardarCotizacionEnviada,
    itemsCalculados, totales, setItems
  } = state;

  return (
    <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,2fr)_320px] md:items-start anim-fade-in">
      <div className="space-y-5">
        <Panel
          titulo="Datos del Cliente y Cotización"
          className="!rounded-[28px] !bg-white/95 !p-5 sm:!p-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
          extraTopRight={
            <ButtonSecondary 
              onClick={() => {
                if(window.confirm("¿Limpiar todos los datos?")) limpiarCotizacion();
              }} 
              className="!h-9 w-full !bg-white !px-4 !text-xs !font-bold !text-slate-600 sm:w-auto hover:!text-red-600 hover:!border-red-200" 
              icon={<Plus size={14} className="rotate-45" />}
            >
              Limpiar Formulario
            </ButtonSecondary>
          }
        >
          <div className="mb-4 rounded-[20px] border border-slate-200/60 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
            <div className="grid gap-4 md:grid-cols-12">
              <Campo label="Cliente" value={datos.cliente} onChange={(v) => actualizarDato("cliente", v)} className="md:col-span-4" inputClassName="h-10 px-3 text-sm font-semibold" labelClassName="!mb-1.5 !text-[10px] !uppercase" />
              <Campo label="Folio COT" value={datos.numeroCotizacion} onChange={(v) => actualizarDato("numeroCotizacion", v)} className="md:col-span-3" inputClassName="h-10 px-3 text-sm font-bold text-sky-900 bg-sky-50/50 border-sky-100" labelClassName="!mb-1.5 !text-[10px] !uppercase text-sky-700" />
              <Campo label="Fecha" type="date" value={datos.fecha} onChange={(v) => actualizarDato("fecha", v)} className="md:col-span-5" inputClassName="h-10 px-3 text-sm font-medium" labelClassName="!mb-1.5 !text-[10px] !uppercase" />
              
              <div className="md:col-span-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Vendedor Asignado</label>
                <select
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)] transition-all focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200/70"
                  value={datos.vendedor || ""}
                  onChange={(e) => actualizarDato("vendedor", e.target.value)}
                >
                  <option value="">Seleccionar vendedor</option>
                  {(brand.vendedores || []).map((v) => (
                    <option key={v.id} value={v.nombre}>{v.nombre}</option>
                  ))}
                </select>
              </div>
              <Campo label="Vigencia" value={datos.vigencia} onChange={(v) => actualizarDato("vigencia", v)} className="md:col-span-8" inputClassName="h-10 px-3 text-sm font-medium" labelClassName="!mb-1.5 !text-[10px] !uppercase" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <Campo label="Desc. (%)" type="number" value={datos.descuentoPorcentaje} onChange={(v) => actualizarDato("descuentoPorcentaje", v)} className="md:col-span-3" inputClassName="h-10 px-3 text-sm font-bold text-emerald-700 bg-emerald-50/30 border-emerald-100" labelClassName="!mb-1.5 !text-[10px] !uppercase text-emerald-700" />
            <Campo label="Forma de Pago" value={datos.formaPago} onChange={(v) => actualizarDato("formaPago", v)} className="md:col-span-3" inputClassName="h-10 px-3 text-sm font-medium" labelClassName="!mb-1.5 !text-[10px] !uppercase" />
            <Campo label="Entrega Est." value={datos.tiempoEntrega} onChange={(v) => actualizarDato("tiempoEntrega", v)} className="md:col-span-3" inputClassName="h-10 px-3 text-sm font-medium" labelClassName="!mb-1.5 !text-[10px] !uppercase" />
            <Campo label="Nota para Cotización" value={datos.nota} onChange={(v) => actualizarDato("nota", v)} className="md:col-span-3" inputClassName="h-10 px-3 text-sm font-medium" labelClassName="!mb-1.5 !text-[10px] !uppercase" />
          </div>

        </Panel>

        <Panel
          titulo="Ítems a Cotizar"
          className="!rounded-[28px] !bg-white/95 !p-5 sm:!p-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
          extraTopRight={
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <ButtonSecondary 
                onClick={() => setModalMagico(true)} 
                className="!h-10 w-full !rounded-[16px] !border-emerald-100 !bg-emerald-50 !px-4 !text-sm !font-bold !text-emerald-800 transition-all hover:!bg-emerald-100/80 hover:!scale-[1.02] active:!scale-95 sm:w-auto" 
                icon={<Sparkles size={16} className="text-emerald-600" />}
              >
                Asistente Magico IA
              </ButtonSecondary>
              <ButtonPrimary 
                onClick={agregarItem} 
                color="#0f172a" 
                className="!h-10 w-full !rounded-[16px] !px-4 !text-sm font-bold hover:!shadow-[0_8px_20px_rgba(15,23,42,0.2)] sm:w-auto transition-transform hover:scale-[1.02] active:scale-95" 
                icon={<Plus size={16} />}
              >
                Añadir Ítem Manual
              </ButtonPrimary>
            </div>
          }
        >
          <div className="space-y-4">
            {itemsCalculados.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center sm:p-10 transition-colors hover:bg-slate-50">
                <div className="mx-auto max-w-md">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                    <Plus size={24} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-800">Lienzo en blanco</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">Agrega ítems manualmente o utiliza el Asistente Mágico para importar medidas desde WhatsApp en segundos.</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <ButtonPrimary onClick={agregarItem} color="#0f172a" className="!h-10 !rounded-[16px] !px-5 !text-sm font-bold shadow-md" icon={<Plus size={16} />}>
                      Agregar primer ítem
                    </ButtonPrimary>
                  </div>
                </div>
              </div>
            ) : (
              itemsCalculados.map((calculado, index) => (
                <ItemCotizacionCard 
                  key={index}
                  index={index}
                  item={items[index]}
                  calculado={calculado}
                  catalogo={catalogo}
                  actualizarItem={actualizarItem}
                  eliminarItem={eliminarItem}
                  clonarItem={clonarItem}
                />
              ))
            )}
          </div>
        </Panel>
      </div>

      <ResumenComercialPanel
        totales={totales}
        datos={datos}
        brand={brand}
        catalogo={catalogo}
        itemsCalculados={itemsCalculados}
        guardandoCotizacion={guardandoCotizacion}
        guardarCotizacionEnviada={guardarCotizacionEnviada}
        limpiarCotizacion={limpiarCotizacion}
        generarPDFCotizacion={generarPDFCotizacion}
      />

      <AsistenteIAPanel 
        visible={modalMagico} 
        setVisible={setModalMagico} 
        brand={brand} 
        catalogo={catalogo} 
        setItems={setItems} 
      />
    </div>
  );
}
