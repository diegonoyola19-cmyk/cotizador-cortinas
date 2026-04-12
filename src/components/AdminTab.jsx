import React, { useEffect, useState } from "react";
import { FileImage, Pencil, Plus, Trash2, Package, Palette, Users, UserCheck, UserMinus, ShieldAlert } from "lucide-react";
import { formatoDinero } from "../utils/helpers";
import { Panel, Campo, CheckboxField, ButtonPrimary } from "./ui";
import { supabase } from "../supabaseClient";

export function AdminTab({ state }) {
  const {
    brand, setBrand,
    catalogo,
    nuevoProducto, setNuevoProducto, agregarProducto, eliminarProducto,
    productoEnEdicion, setProductoEnEdicion, iniciarEdicionProducto, cancelarEdicionProducto, guardarEdicionProducto,
  } = state;

  const [nuevoVendedor, setNuevoVendedor] = useState({ nombre: "", celular: "" });
  const [subTabActiva, setSubTabActiva] = useState("productos");
  const [configCargaTonos, setConfigCargaTonos] = useState({ linea: "", carpeta: "" });
  
  // NUBE: Gestión de Perfiles
  const [usuariosNube, setUsuariosNube] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const cargarUsuariosDeNube = async () => {
    setCargandoUsuarios(true);
    const { data } = await supabase.from("perfiles").select("*").order("created_at", { ascending: false });
    if (data) setUsuariosNube(data);
    setCargandoUsuarios(false);
  };

  useEffect(() => {
    if (subTabActiva === "equipo") {
      cargarUsuariosDeNube();
    }
  }, [subTabActiva]);

  const cambiarRolUsuario = async (id, nuevoRol) => {
    const { error } = await supabase.from("perfiles").update({ role: nuevoRol }).eq("id", id);
    if (!error) cargarUsuariosDeNube();
    else alert("Error al actualizar rol: " + error.message);
  };
  const lineasBase = ["Screen", "Blackout", "Exterior / ATOS"];
  const lineasTonos = Array.from(new Set([...(brand.tonosCatalogo || []).map((tono) => tono.linea).filter(Boolean), ...lineasBase]));
  const carpetasTonos = Array.from(new Set((brand.tonosCatalogo || []).map((tono) => tono.carpeta).filter(Boolean)));

  const detectarLineaProducto = (producto) => {
    if (producto?.lineaTonos) return producto.lineaTonos;
    const texto = `${producto?.nombre || ""} ${producto?.categoria || ""}`.toLowerCase();
    if (texto.includes("screen")) return "Screen";
    if (texto.includes("blackout")) return "Blackout";
    if (texto.includes("attos") || texto.includes("atos") || texto.includes("exterior")) return "Exterior / ATOS";
    return "";
  };

  const obtenerTonosProducto = (producto) => {
    const linea = detectarLineaProducto(producto);
    return (brand.tonosCatalogo || []).filter((tono) => (linea ? tono.linea === linea : false));
  };

  const tonosProductoAgrupados = (producto) =>
    obtenerTonosProducto(producto).reduce((acc, tono) => {
      const clave = tono.carpeta || "General";
      if (!acc[clave]) acc[clave] = [];
      acc[clave].push(tono);
      return acc;
    }, {});

  const cargarTonos = async (files) => {
    const archivos = Array.from(files || []);
    if (!archivos.length) return;

    const nuevosTonos = await Promise.all(
      archivos.map(
        (archivo) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: window.crypto.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                nombre: archivo.name.replace(/\.[^.]+$/, ""),
                linea: configCargaTonos.linea || "",
                carpeta: configCargaTonos.carpeta.trim() || "",
                src: String(reader.result || ""),
              });
            reader.onerror = reject;
            reader.readAsDataURL(archivo);
          })
      )
    );

    setBrand((prev) => ({ ...prev, tonosCatalogo: [...(prev.tonosCatalogo || []), ...nuevosTonos] }));
  };

  const actualizarTono = (id, cambios) => {
    setBrand((prev) => ({
      ...prev,
      tonosCatalogo: (prev.tonosCatalogo || []).map((tono) => (tono.id === id ? { ...tono, ...cambios } : tono)),
    }));
  };

  const eliminarTono = (id) => {
    setBrand((prev) => ({
      ...prev,
      tonosCatalogo: (prev.tonosCatalogo || []).filter((tono) => tono.id !== id),
    }));
  };

  const agregarVendedor = () => {
    if (!nuevoVendedor.nombre.trim()) return;
    const nuevo = { id: window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(), ...nuevoVendedor };
    setBrand((prev) => ({ ...prev, vendedores: [...(prev.vendedores || []), nuevo] }));
    setNuevoVendedor({ nombre: "", celular: "" });
  };

  const eliminarVendedor = (id) => {
    setBrand((prev) => ({ ...prev, vendedores: (prev.vendedores || []).filter((v) => v.id !== id) }));
  };

  const tonosAgrupados = (brand.tonosCatalogo || []).reduce((acc, tono) => {
    const linea = tono.linea || "Sin linea";
    const carpeta = tono.carpeta || "Sin carpeta";
    if (!acc[linea]) acc[linea] = {};
    if (!acc[linea][carpeta]) acc[linea][carpeta] = [];
    acc[linea][carpeta].push(tono);
    return acc;
  }, {});

  return (
    <div className="mt-4 space-y-6 anim-fade-in">
      <Panel titulo="Panel Administrativo">
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-bold text-slate-800">Gestion interna</h3>
          <p className="mt-1 text-sm text-slate-500">
            El historial ahora vive en su propia vista para mantener este panel enfocado en productos, tonos y equipo de ventas.
          </p>
        </div>

        <div className="mb-6 flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setSubTabActiva("productos")}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-bold transition-colors ${subTabActiva === "productos" ? "bg-white text-sky-600 border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]" : "text-slate-500 hover:text-slate-700 bg-slate-50/50"}`}
          >
            <Package size={16} /> Productos
          </button>
          <button
            onClick={() => setSubTabActiva("tonos")}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-bold transition-colors ${subTabActiva === "tonos" ? "bg-white text-indigo-600 border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]" : "text-slate-500 hover:text-slate-700 bg-slate-50/50"}`}
          >
            <Palette size={16} /> Tonos
          </button>
          <button
            onClick={() => setSubTabActiva("equipo")}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-bold transition-colors ${subTabActiva === "equipo" ? "bg-white text-emerald-600 border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]" : "text-slate-500 hover:text-slate-700 bg-slate-50/50"}`}
          >
            <Users size={16} /> Gestión Cuentas CRM
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-1">
          {subTabActiva === "productos" && (
            <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Directorio de Productos</h3>
              </div>
              <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <h4 className="mb-2 text-xs font-bold uppercase text-slate-500">Nuevo Producto</h4>
                <Campo label="Nombre" value={nuevoProducto.nombre} onChange={(v) => setNuevoProducto((prev) => ({ ...prev, nombre: v }))} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Categoria" value={nuevoProducto.categoria} onChange={(v) => setNuevoProducto((prev) => ({ ...prev, categoria: v }))} />
                  <Campo label="Precio/Base" type="number" value={nuevoProducto.precio} onChange={(v) => setNuevoProducto((prev) => ({ ...prev, precio: v }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Catalogo de tonos relacionado</label>
                  <select
                    value={nuevoProducto.lineaTonos || ""}
                    onChange={(e) => setNuevoProducto((prev) => ({ ...prev, lineaTonos: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
                  >
                    <option value="">Detectar automaticamente</option>
                    {lineasTonos.map((lineaOpcion) => (
                      <option key={lineaOpcion} value={lineaOpcion}>{lineaOpcion}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100/50 pt-1">
                  <CheckboxField label="Usa ancho/alto" checked={nuevoProducto.usaMedidas} onChange={(checked) => setNuevoProducto((prev) => ({ ...prev, usaMedidas: checked }))} />
                  <ButtonPrimary onClick={agregarProducto} color={brand.colorPrimario} className="!px-3 !py-1.5 !text-xs" icon={<Plus size={14} />}>
                    Anadir
                  </ButtonPrimary>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {catalogo.map((producto) => {
                  const editando = productoEnEdicion?.id === producto.id;
                  const lineaProducto = detectarLineaProducto(producto);
                  const tonosProducto = obtenerTonosProducto(producto);
                  const tonosPorCarpeta = tonosProductoAgrupados(producto);

                  return (
                    <div key={producto.id} className={`rounded-xl border p-3 ${editando ? "border-indigo-300 bg-indigo-50/20 shadow-sm" : "border-slate-200 bg-white"}`}>
                      {editando ? (
                        <div className="space-y-2">
                          <Campo label="Nombre" value={productoEnEdicion.nombre} onChange={(v) => setProductoEnEdicion((prev) => ({ ...prev, nombre: v }))} />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Campo label="Cat." value={productoEnEdicion.categoria} onChange={(v) => setProductoEnEdicion((prev) => ({ ...prev, categoria: v }))} />
                            <Campo label="Precio" type="number" value={productoEnEdicion.precio} onChange={(v) => setProductoEnEdicion((prev) => ({ ...prev, precio: v }))} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Catalogo de tonos relacionado</label>
                            <select
                              value={productoEnEdicion.lineaTonos || ""}
                              onChange={(e) => setProductoEnEdicion((prev) => ({ ...prev, lineaTonos: e.target.value }))}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
                            >
                              <option value="">Detectar automaticamente</option>
                              {lineasTonos.map((lineaOpcion) => (
                                <option key={lineaOpcion} value={lineaOpcion}>{lineaOpcion}</option>
                              ))}
                            </select>
                          </div>
                          <CheckboxField label="Usa medidas" checked={productoEnEdicion.usaMedidas} onChange={(checked) => setProductoEnEdicion((prev) => ({ ...prev, usaMedidas: checked }))} />
                          <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-[11px] text-slate-500">
                            Puedes relacionar manualmente el catalogo de tonos o dejar que se detecte automaticamente por nombre y categoria.
                          </div>
                          <div className="flex gap-2 pt-1">
                            <ButtonPrimary onClick={guardarEdicionProducto} color={brand.colorPrimario} className="w-full !py-1.5 !text-xs text-center">
                              Guardar
                            </ButtonPrimary>
                            <button
                              onClick={cancelarEdicionProducto}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="pr-2 text-sm font-bold leading-tight text-slate-800">{producto.nombre}</div>
                              <div className="text-[10px] font-bold uppercase text-slate-500">
                                {producto.categoria || "N/A"} • {producto.usaMedidas ? "M2" : "BASE"} • {formatoDinero(producto.precio)}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col gap-1">
                              <button onClick={() => iniciarEdicionProducto(producto)} className="rounded bg-slate-100 p-1 text-slate-600 transition-colors hover:bg-slate-200">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => eliminarProducto(producto.id)} className="rounded bg-red-50 p-1 text-red-600 transition-colors hover:bg-red-100">
                                <Plus size={12} className="rotate-45" />
                              </button>
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Tonos vinculados</span>
                              {lineaProducto ? (
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                                  {lineaProducto}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Sin linea detectada</span>
                              )}
                            </div>
                            {tonosProducto.length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(tonosPorCarpeta).map(([carpeta, tonos]) => (
                                  <div key={`${producto.id}-${carpeta}`} className="space-y-1">
                                    <p className="text-[10px] font-semibold text-slate-500">{carpeta}</p>
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                      {tonos.slice(0, 12).map((tono) => (
                                        <div key={tono.id} className="shrink-0 text-center">
                                          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                                            <img src={tono.src} alt={tono.nombre || "Tono"} className="h-full w-full object-cover" />
                                          </div>
                                        </div>
                                      ))}
                                      {tonos.length > 12 && (
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-[10px] font-semibold text-slate-500">
                                          +{tonos.length - 12}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500">
                                {lineaProducto
                                  ? "No hay tonos cargados para esta linea aun."
                                  : "Define la categoria o nombre del producto para enlazar sus tonos."}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {subTabActiva === "tonos" && (
            <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-indigo-50/30 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Banco de Tonos</h3>
              </div>
              <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500">Archivador</h4>
                    <p className="mt-1 text-xs text-slate-500">Organiza los tonos por linea y carpeta para encontrarlos rapido.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                    <FileImage size={14} />
                    Subir tonos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        await cargarTonos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">Linea para la carga</label>
                    <select
                      value={configCargaTonos.linea}
                      onChange={(e) => setConfigCargaTonos((prev) => ({ ...prev, linea: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
                    >
                      <option value="">Sin linea</option>
                      {lineasTonos.map((lineaOpcion) => (
                        <option key={lineaOpcion} value={lineaOpcion}>{lineaOpcion}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">Carpeta o grupo</label>
                    <input
                      list="carpetas-tonos"
                      value={configCargaTonos.carpeta}
                      onChange={(e) => setConfigCargaTonos((prev) => ({ ...prev, carpeta: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
                      placeholder="Ej: Screen 5%, Texturas claras"
                    />
                    <datalist id="carpetas-tonos">
                      {carpetasTonos.map((carpeta) => (
                        <option key={carpeta} value={carpeta} />
                      ))}
                    </datalist>
                  </div>
                </div>
                {(brand.tonosCatalogo || []).length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {Object.entries(tonosAgrupados).map(([linea, carpetas]) => (
                      <div key={linea} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-slate-200" />
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{linea}</p>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        {Object.entries(carpetas).map(([carpeta, tonos]) => (
                          <div key={`${linea}-${carpeta}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] font-semibold text-slate-700">{carpeta}</p>
                                <p className="text-[10px] text-slate-500">{tonos.length} tono(s)</p>
                              </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {tonos.map((tono) => (
                                <div key={tono.id} className="rounded-xl border border-slate-200 bg-white p-2">
                                  <div className="flex gap-2">
                                    <div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                      <img src={tono.src} alt={tono.nombre || "Tono"} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2">
                                      <input
                                        type="text"
                                        value={tono.nombre || ""}
                                        onChange={(e) => actualizarTono(tono.id, { nombre: e.target.value })}
                                        className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
                                        placeholder="Nombre del tono"
                                      />
                                      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                        <select
                                          value={tono.linea || ""}
                                          onChange={(e) => actualizarTono(tono.id, { linea: e.target.value })}
                                          className="h-8 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
                                        >
                                          <option value="">Sin linea</option>
                                          {lineasTonos.map((lineaOpcion) => (
                                            <option key={lineaOpcion} value={lineaOpcion}>{lineaOpcion}</option>
                                          ))}
                                        </select>
                                        <input
                                          list="carpetas-tonos"
                                          value={tono.carpeta || ""}
                                          onChange={(e) => actualizarTono(tono.id, { carpeta: e.target.value })}
                                          className="h-8 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
                                          placeholder="Carpeta"
                                        />
                                        <button
                                          onClick={() => eliminarTono(tono.id)}
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                          title="Eliminar tono"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-xs text-slate-500 mt-4">
                    Aun no has agregado tonos al banco.
                  </div>
                )}
              </div>
            </div>
          )}

          {subTabActiva === "equipo" && (
            <div className="flex h-full flex-col rounded-xl border border-emerald-100 bg-emerald-50/20 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Controles de Acceso Globales</h3>
                <button onClick={cargarUsuariosDeNube} className="text-xs font-bold text-emerald-600 hover:underline">Refrescar DB</button>
              </div>
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 shadow-sm">
                <strong>Importante:</strong> Ya no agregas vendedores manualmente. Deben crear su cuenta en la pantalla de inicio principal (Login) y aparecerán aquí como <b>"Pendientes"</b> para que tú los autorices a ver el panel de ventas de la empresa.
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {cargandoUsuarios ? (
                  <p className="text-sm text-slate-500 text-center py-4">Buscando solicitudes en Supabase...</p>
                ) : usuariosNube.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No hay cuentas registradas en el sistema.</p>
                ) : (
                  usuariosNube.map((userNube) => (
                    <div key={userNube.id} className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${userNube.role === 'pending' ? 'border-amber-300 bg-amber-50 shadow-[0_4px_10px_rgba(251,191,36,0.2)]' : 'border-slate-200 bg-white'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">{userNube.vendedor_nombre}</span>
                          {userNube.role === 'pending' && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><ShieldAlert size={12}/> Envío Sólitud</span>}
                          {userNube.role === 'admin' && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Super Admin</span>}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">{userNube.email}</div>
                      </div>
                      <div className="flex gap-2">
                        {userNube.role === 'pending' && (
                          <>
                            <button onClick={() => cambiarRolUsuario(userNube.id, 'vendedor')} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                              <UserCheck size={14}/> Aprobar Acceso
                            </button>
                            <button onClick={async () => {
                               if (window.confirm("¿Rechazar y purgar esta cuenta? El usuario deberá crearla de nuevo si ingresó mal el correo.")) {
                                  alert("Por seguridad de Supabase, para eliminar el usuario definitivo, debes borrarlo desde el panel web de Supabase Auth. Puedes dejarlo pendiente y nunca entrará.");
                               }
                            }} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                              Denegar
                            </button>
                          </>
                        )}
                        {userNube.role === 'vendedor' && (
                          <button onClick={() => {
                             if(window.confirm("¿Seguro que deseas bloquear a este vendedor? Ya no podrá entrar al cotizador.")) {
                                cambiarRolUsuario(userNube.id, 'pending');
                             }
                          }} className="flex items-center gap-1 border border-red-200 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                            <UserMinus size={14}/> Suspender
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
