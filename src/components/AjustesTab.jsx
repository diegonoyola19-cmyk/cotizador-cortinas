import { Cloud, Sparkles } from "lucide-react";
import { Panel, Campo, ButtonPrimary, ButtonSecondary } from "./ui";
import { defaultBrand, MEC_LOGO_PRIMARY_COLOR } from "../utils/constants";

export function AjustesTab({ state }) {
  const {
    brand, setBrand,
    manejarLogo,
    syncKey, setSyncKey, estadoNube, sincronizando, guardarEnNube, cargarDesdeNube
  } = state;

  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-start anim-fade-in">
      <Panel titulo="Marca y Configuración Visual">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Personaliza los colores y datos que aparecen en el PDF y encabezado.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Campo label="Empresa" value={brand.empresa} onChange={(v) => setBrand((prev) => ({ ...prev, empresa: v }))} />
          </div>
          <div className="sm:col-span-2">
            <Campo label="Eslogan" value={brand.slogan || ""} onChange={(v) => setBrand((prev) => ({ ...prev, slogan: v }))} />
          </div>
          <Campo label="Atiende" value={brand.atiende} onChange={(v) => setBrand((prev) => ({ ...prev, atiende: v }))} />
          <Campo label="Celular" value={brand.celular} onChange={(v) => setBrand((prev) => ({ ...prev, celular: v }))} />
          <div className="sm:col-span-2">
            <Campo label="Correo" value={brand.correo} onChange={(v) => setBrand((prev) => ({ ...prev, correo: v }))} />
          </div>
          
          <div className="flex flex-col">
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color Principal</label>
            <input type="color" value={brand.colorPrimario} onChange={(e) => setBrand((prev) => ({ ...prev, colorPrimario: e.target.value }))} className="h-10 w-full cursor-pointer rounded-lg border-none bg-transparent" />
            <button
              onClick={() => setBrand((prev) => ({ ...prev, colorPrimario: MEC_LOGO_PRIMARY_COLOR }))}
              className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Usar color del logo MEC
            </button>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color Secundario</label>
            <input type="color" value={brand.colorSecundario} onChange={(e) => setBrand((prev) => ({ ...prev, colorSecundario: e.target.value }))} className="h-10 w-full cursor-pointer rounded-lg border-none bg-transparent" />
          </div>

          <div className="sm:col-span-2 mt-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logo de la Empresa</label>
            <input type="file" accept="image/*" onChange={manejarLogo} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300" />
            {brand.logo && (
              <div className="mt-3 flex flex-col items-start gap-2">
                <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/80 inline-block">
                  <img src={brand.logo} alt="Logo" className="h-20 object-contain dark:brightness-110" />
                </div>
                <button
                  onClick={() =>
                    setBrand((prev) => ({
                      ...prev,
                      logo: defaultBrand.logo,
                      colorPrimario: MEC_LOGO_PRIMARY_COLOR,
                    }))
                  }
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
                >
                  Cargar Nuevo Logo MEC
                </button>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel titulo="Sincronización en la Nube">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Conecta tus dispositivos para acceder a tu catálogo, borradores, e historial usando una clave compartida.
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 p-3 text-sm text-indigo-700 dark:text-indigo-300">
            <Cloud size={20} className="shrink-0 mt-0.5" />
            <p>Usar la misma clave en todos tus dispositivos conecta el borrador en linea: abre en telefono o PC y se carga solo.</p>
          </div>
          <Campo label="Clave de Sync" value={syncKey} onChange={setSyncKey} />
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300 font-mono">
            Estado: {estadoNube}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ButtonPrimary onClick={guardarEnNube} disabled={sincronizando} color={brand.colorPrimario} className="py-2.5">
              Sincronizar ahora
            </ButtonPrimary>
            <ButtonSecondary onClick={() => cargarDesdeNube()} disabled={sincronizando} className="py-2.5">
              Recargar ahora
            </ButtonSecondary>
          </div>
        </div>
      </Panel>
      <Panel titulo="Inteligencia Artificial (Gemini AI)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Conecta la API de Google Gemini para habilitar el asistente de ventas, llenado mágico y resúmenes estadísticos.
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/30">
            <Sparkles size={20} className="shrink-0 mt-0.5" />
            <p>Tu clave API se almacena de manera segura <b className="dark:text-emerald-100">únicamente en tu navegador local</b>.</p>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Clave API de Gemini</label>
            <input 
              type="password" 
              placeholder="AIzaSy..."
              value={brand.geminiApiKey || ""} 
              onChange={(e) => setBrand((prev) => ({ ...prev, geminiApiKey: e.target.value }))} 
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 shadow-sm transition-all focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20"
            />
            <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">Puedes obtener tu clave gratuita en <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 underline">Google AI Studio</a>.</p>
          </div>
        </div>
      </Panel>

    </div>
  );
}

