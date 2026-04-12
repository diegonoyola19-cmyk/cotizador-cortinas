import { useState, useEffect, useMemo, useRef } from "react";
import { SUPABASE_CONFIG_OK, supabase } from "../supabaseClient";
import {
  STORAGE_KEYS, SUPABASE_TABLE, QUOTES_TABLE, DEFAULT_SYNC_KEY,
  defaultBrand, defaultCatalog, defaultQuoteData, generarId
} from "../utils/constants";
import {
  leerStorage, guardarStorage, crearItem,
  calcularItems, calcularTotales
} from "../utils/helpers";

export function useCotizadorState(authProfile = null) {
  const [tabActiva, setTabActiva] = useState("estadisticas");
  const [brand, setBrand] = useState(() => ({ ...defaultBrand, ...leerStorage(STORAGE_KEYS.brand, defaultBrand) }));
  const [catalogo, setCatalogo] = useState(() => {
    const guardado = leerStorage(STORAGE_KEYS.catalog, defaultCatalog);
    return Array.isArray(guardado) && guardado.length ? guardado : defaultCatalog;
  });
  const [datos, setDatos] = useState(() => ({ ...defaultQuoteData }));
  const [items, setItems] = useState(() => []);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    categoria: "",
    precio: "",
    usaMedidas: true,
    lineaTonos: "",
  });
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const [syncKey, setSyncKey] = useState(() => leerStorage(STORAGE_KEYS.syncKey, DEFAULT_SYNC_KEY));
  const [estadoNube, setEstadoNube] = useState(
    SUPABASE_CONFIG_OK
      ? "Conexion lista para sincronizar."
      : "Falta configurar las variables publicas de Supabase."
  );
  const [sincronizando, setSincronizando] = useState(false);
  const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);
  const [cargandoAdmin, setCargandoAdmin] = useState(false);
  const [cotizacionesGuardadas, setCotizacionesGuardadas] = useState([]);
  const [filtroAdmin, setFiltroAdmin] = useState("");
  const [filtroEstatusHistorial, setFiltroEstatusHistorial] = useState("todos");
  const [cotizacionSeleccionadaId, setCotizacionSeleccionadaId] = useState("");
  const [mensajeAdmin, setMensajeAdmin] = useState("Aqui podras revisar el historial de cotizaciones enviadas.");
  const lastSavedData = useRef("");
  const currentDraftRef = useRef("");
  const applyingRemoteRef = useRef(false);
  const hydrationDoneRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastRemoteUpdatedAtRef = useRef("");

  function serializarBorrador(payload = {}) {
    return JSON.stringify({
      brand: payload.brand ?? brand,
      catalogo: payload.catalogo ?? catalogo,
      datos: payload.datos ?? datos,
      items: payload.items ?? items,
    });
  }

  function aplicarBorradorRemoto(data, opciones = {}) {
    const remoteUpdatedAt = String(data?.updated_at || "");
    const catalogoRemoto = Array.isArray(data?.catalog) && data.catalog.length ? data.catalog : defaultCatalog;
    const brandRemota = { ...defaultBrand, ...(data?.brand || {}) };
    const datosRemotos = { ...defaultQuoteData, ...(data?.quote || {}) };
    const itemsRemotos = Array.isArray(data?.items) ? data.items : [];
    const draftSerializado = serializarBorrador({
      brand: brandRemota,
      catalogo: catalogoRemoto,
      datos: datosRemotos,
      items: itemsRemotos,
    });

    applyingRemoteRef.current = true;
    setBrand(brandRemota);
    setCatalogo(catalogoRemoto);
    setDatos(datosRemotos);
    setItems(itemsRemotos);
    lastSavedData.current = draftSerializado;
    currentDraftRef.current = draftSerializado;
    lastRemoteUpdatedAtRef.current = remoteUpdatedAt;

    window.clearTimeout(saveTimeoutRef.current);
    window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 0);

    if (!opciones.silencioso) {
      setEstadoNube(`Sincronizado en linea con "${String(syncKey || "").trim()}".`);
    }
  }

  function extraerConsecutivo(numeroCotizacion) {
    const coincidencia = String(numeroCotizacion || "").match(/(\d+)\s*$/);
    return coincidencia ? Number(coincidencia[1]) : 0;
  }

  function obtenerSiguienteNumeroCotizacion(registros = cotizacionesGuardadas) {
    const maximoHistorial = (registros || []).reduce((acumulado, registro) => {
      const consecutivo = extraerConsecutivo(registro?.quote?.numeroCotizacion);
      return consecutivo > acumulado ? consecutivo : acumulado;
    }, 0);
    const maximoLocal = Number(leerStorage(STORAGE_KEYS.quoteCounter, 0) || 0);
    const maximoActual = extraerConsecutivo(datos.numeroCotizacion);
    const maximo = Math.max(maximoHistorial, maximoLocal, maximoActual);

    return `COT-${String(maximo + 1).padStart(3, "0")}`;
  }

  function registrarNumeroCotizacion(numeroCotizacion) {
    const consecutivo = extraerConsecutivo(numeroCotizacion);
    const actual = Number(leerStorage(STORAGE_KEYS.quoteCounter, 0) || 0);
    if (consecutivo > actual) {
      guardarStorage(STORAGE_KEYS.quoteCounter, consecutivo);
    }
  }

  useEffect(() => guardarStorage(STORAGE_KEYS.brand, brand), [brand]);
  useEffect(() => guardarStorage(STORAGE_KEYS.catalog, catalogo), [catalogo]);
  useEffect(() => guardarStorage(STORAGE_KEYS.syncKey, syncKey), [syncKey]);
  useEffect(() => {
    if (datos.numeroCotizacion) registrarNumeroCotizacion(datos.numeroCotizacion);
  }, [datos.numeroCotizacion]);

  useEffect(() => {
    if (tabActiva === "cotizacion" && !datos.numeroCotizacion) {
      setDatos((prev) => ({ ...prev, numeroCotizacion: obtenerSiguienteNumeroCotizacion() }));
    }
  }, [cotizacionesGuardadas, tabActiva, datos.numeroCotizacion]);

  useEffect(() => {
    currentDraftRef.current = serializarBorrador();
  }, [brand, catalogo, datos, items]);

  useEffect(() => {
    if (!SUPABASE_CONFIG_OK) return;
  }, []);

  useEffect(() => {
    if (!SUPABASE_CONFIG_OK) return undefined;
    const clave = String(syncKey || "").trim();
    if (!clave) {
      hydrationDoneRef.current = false;
      return undefined;
    }

    let cancelado = false;

    const inicializar = async () => {
      setEstadoNube(`Conectando en linea con "${clave}"...`);
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select("brand, catalog, quote, items, updated_at")
        .eq("id", clave)
        .maybeSingle();

      if (cancelado) return;

      if (error) {
        setEstadoNube("No se pudo conectar con la nube.");
        hydrationDoneRef.current = true;
        return;
      }

      if (data) {
        aplicarBorradorRemoto(data, { silencioso: true });
        setEstadoNube(`Sincronizado en linea con "${clave}".`);
      } else {
        lastSavedData.current = "";
        currentDraftRef.current = serializarBorrador();
        lastRemoteUpdatedAtRef.current = "";
        setEstadoNube(`Modo en linea activo para "${clave}".`);
      }

      hydrationDoneRef.current = true;
    };

    inicializar();

    const channel = supabase
      .channel(`draft-sync:${clave}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SUPABASE_TABLE, filter: `id=eq.${clave}` },
        (payload) => {
          if (!payload.new) return;
          const hayCambiosLocalesPendientes = currentDraftRef.current !== lastSavedData.current;
          const remoteUpdatedAt = String(payload.new.updated_at || "");
          const yaProcesado = remoteUpdatedAt && remoteUpdatedAt === lastRemoteUpdatedAtRef.current;

          if (yaProcesado) return;
          if (hayCambiosLocalesPendientes) {
            setEstadoNube("Hay cambios locales pendientes; no se sobrescribio el borrador.");
            return;
          }

          aplicarBorradorRemoto(payload.new, { silencioso: true });
          setEstadoNube(`Actualizado en linea desde otro dispositivo (${new Date().toLocaleTimeString()}).`);
        }
      )
      .subscribe();

    const recargarEnFoco = () => {
      if (document.visibilityState === "visible" && currentDraftRef.current === lastSavedData.current) {
        cargarDesdeNube({ silencioso: true });
      }
    };

    document.addEventListener("visibilitychange", recargarEnFoco);
    window.addEventListener("focus", recargarEnFoco);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", recargarEnFoco);
      window.removeEventListener("focus", recargarEnFoco);
      window.clearTimeout(saveTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [syncKey]);

  useEffect(() => {
    if (!SUPABASE_CONFIG_OK) return undefined;
    const clave = String(syncKey || "").trim();
    if (!clave || !hydrationDoneRef.current || applyingRemoteRef.current) return undefined;

    const currentDataStr = serializarBorrador();
    if (currentDataStr === lastSavedData.current) return undefined;

    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      guardarEnNube({ silencioso: true });
    }, 1200);

    return () => window.clearTimeout(saveTimeoutRef.current);
  }, [syncKey, brand, catalogo, datos, items]);

  useEffect(() => {
    if (!["admin", "historial", "estadisticas"].includes(tabActiva) || !SUPABASE_CONFIG_OK) return;
    cargarPanelAdministrativo();
  }, [tabActiva, syncKey]);

  const itemsCalculados = useMemo(() => calcularItems(items), [items]);
  const totales = useMemo(() => calcularTotales(itemsCalculados, datos.ivaPorcentaje, datos.descuentoPorcentaje), [itemsCalculados, datos.ivaPorcentaje, datos.descuentoPorcentaje]);

  const cotizacionesFiltradas = useMemo(() => {
    const texto = filtroAdmin.trim().toLowerCase();
    if (!texto) return cotizacionesGuardadas;

    return cotizacionesGuardadas.filter((registro) => {
      const cliente = String(registro.quote?.cliente || "").toLowerCase();
      const fecha = String(registro.quote?.fecha || "").toLowerCase();
      const estado = String(registro.status || "").toLowerCase();
      const vendedor = String(registro.quote?.vendedor || "").toLowerCase();
      return cliente.includes(texto) || vendedor.includes(texto) || fecha.includes(texto) || estado.includes(texto);
    });
  }, [cotizacionesGuardadas, filtroAdmin]);

  function actualizarDato(campo, valor) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function detectarLineaProducto(producto, item = {}) {
    if (producto?.lineaTonos) return producto.lineaTonos;
    const texto = `${producto?.nombre || ""} ${producto?.categoria || ""}`.toLowerCase();
    
    if (texto.includes("blackout") || texto.includes("black out")) return "Blackout";
    if (texto.includes("screen")) return "Screen";
    if (texto.includes("attos") || texto.includes("atos") || texto.includes("exterior")) return "Exterior / ATOS";
    return "";
  }

  function obtenerTonosPorLinea(linea) {
    if (!linea) return [];
    return (brand.tonosCatalogo || []).filter((tono) => tono.linea === linea);
  }

  function construirItemDesdeProducto(producto, itemBase = {}) {
    const linea = detectarLineaProducto(producto, itemBase);
    return {
      ...itemBase,
      catalogId: producto?.id || "",
      descripcion: producto?.nombre || "",
      precio: producto?.precio || 0,
      usaMedidas: producto?.usaMedidas ?? true,
      ancho: producto?.usaMedidas ? itemBase.ancho : "",
      alto: producto?.usaMedidas ? itemBase.alto : "",
      tonosSeleccionados: obtenerTonosPorLinea(linea),
    };
  }

  function actualizarItem(index, campo, valor) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (campo === "catalogId") {
          const producto = catalogo.find((p) => p.id === valor);
          const nuevoItem = construirItemDesdeProducto(producto, item);
          
          if (producto?.nombre?.toLowerCase().includes("instalaci") && !producto.usaMedidas) {
            const cortinasCount = prev.reduce((sum, curr, currIndex) => {
              if (currIndex !== index && curr.usaMedidas) {
                return sum + (Number(curr.cantidad) || 0);
              }
              return sum;
            }, 0);
            
            if (cortinasCount > 0) {
              nuevoItem.cantidad = cortinasCount;
            }
          }
          
          return nuevoItem;
        }
        return { ...item, [campo]: valor };
      })
    );
  }

  function agregarItem() {
    const primero = catalogo[0];
    const itemBase = crearItem(catalogo);
    setItems((prev) => [construirItemDesdeProducto(primero, itemBase), ...prev]);
  }

  function eliminarItem(index) {
    const nuevos = items.filter((_, i) => i !== index);
    if (nuevos.length) {
      setItems(nuevos);
      return;
    }
    const primero = catalogo[0];
    const itemBase = crearItem(catalogo);
    setItems([construirItemDesdeProducto(primero, itemBase)]);
  }

  function clonarItem(index) {
    setItems((prev) => {
      const listaOriginal = [...prev];
      const itemCopiado = JSON.parse(JSON.stringify(listaOriginal[index]));
      listaOriginal.splice(index + 1, 0, itemCopiado);
      return listaOriginal;
    });
  }

  function limpiarCotizacion() {
    const confirmado = window.confirm("Deseas limpiar la cotizacion actual?");
    if (!confirmado) return;
    const nuevaCotizacion = {
      ...defaultQuoteData,
      fecha: new Date().toISOString().slice(0, 10),
      numeroCotizacion: obtenerSiguienteNumeroCotizacion(),
    };
    registrarNumeroCotizacion(nuevaCotizacion.numeroCotizacion);
    setDatos(nuevaCotizacion);
    setItems([]);
  }

  function manejarLogo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = () => setBrand((prev) => ({ ...prev, logo: String(reader.result || "") }));
    reader.readAsDataURL(archivo);
  }

  function agregarProducto() {
    if (!nuevoProducto.nombre.trim()) return;
    const nuevo = {
      id: generarId(),
      nombre: nuevoProducto.nombre.trim(),
      categoria: nuevoProducto.categoria.trim(),
      precio: Number(nuevoProducto.precio || 0),
      usaMedidas: nuevoProducto.usaMedidas,
      lineaTonos: nuevoProducto.lineaTonos || "",
    };
    setCatalogo((prev) => [...prev, nuevo]);
    setNuevoProducto({ nombre: "", categoria: "", precio: "", usaMedidas: true, lineaTonos: "" });
  }

  function eliminarProducto(id) {
    if (catalogo.length <= 1) {
      alert("Debes dejar al menos un producto en el catalogo.");
      return;
    }
    const nuevos = catalogo.filter((p) => p.id !== id);
    setCatalogo(nuevos);
    setItems((prev) =>
      prev.map((item) => {
        if (item.catalogId !== id) return item;
        const primero = nuevos[0];
        return construirItemDesdeProducto(primero, item);
      })
    );
    if (productoEnEdicion?.id === id) setProductoEnEdicion(null);
  }

  function iniciarEdicionProducto(producto) { setProductoEnEdicion({ ...producto }); }
  function cancelarEdicionProducto() { setProductoEnEdicion(null); }

  function guardarEdicionProducto() {
    if (!productoEnEdicion?.nombre?.trim()) return;
    setCatalogo((prev) =>
      prev.map((producto) =>
        producto.id === productoEnEdicion.id
          ? {
              ...producto,
              nombre: productoEnEdicion.nombre.trim(),
              categoria: productoEnEdicion.categoria.trim(),
              precio: Number(productoEnEdicion.precio || 0),
              usaMedidas: productoEnEdicion.usaMedidas,
              lineaTonos: productoEnEdicion.lineaTonos || "",
            }
          : producto
      )
    );
    setItems((prev) =>
      prev.map((item) => {
        if (item.catalogId !== productoEnEdicion.id) return item;
        return construirItemDesdeProducto(
          {
            ...productoEnEdicion,
            nombre: productoEnEdicion.nombre.trim(),
            categoria: productoEnEdicion.categoria.trim(),
            precio: Number(productoEnEdicion.precio || 0),
            lineaTonos: productoEnEdicion.lineaTonos || "",
          },
          item
        );
      })
    );
    setProductoEnEdicion(null);
  }

  async function guardarEnNube(opciones = {}) {
    if (!SUPABASE_CONFIG_OK || !supabase) { 
      if (!opciones.silencioso) setEstadoNube("Configura Supabase."); 
      return; 
    }
    const clave = String(syncKey || "").trim();
    if (!clave) { 
      if (!opciones.silencioso) setEstadoNube("Ingresa una clave de sincronizacion."); 
      return; 
    }

    if (!opciones.silencioso) {
      setSincronizando(true);
      setEstadoNube("Guardando cambios...");
    }
    
    const currentDataStr = JSON.stringify({ brand, catalogo, datos, items });
    const updatedAt = new Date().toISOString();
    const payload = { id: clave, brand, catalog: catalogo, quote: datos, items, updated_at: updatedAt };
    const { error } = await supabase.from(SUPABASE_TABLE).upsert(payload, { onConflict: "id" });
    
    if (error) {
      setEstadoNube("No se pudo guardar en Supabase.");
    } else {
      lastSavedData.current = currentDataStr;
      currentDraftRef.current = currentDataStr;
      lastRemoteUpdatedAtRef.current = updatedAt;
      setEstadoNube(
        opciones.silencioso
          ? `Sincronizado en linea con "${clave}" (${new Date().toLocaleTimeString()}).`
          : `Borrador sincronizado con "${clave}".`
      );
    }
    if (!opciones.silencioso) setSincronizando(false);
  }

  async function cargarDesdeNube(opciones = {}) {
    if (!SUPABASE_CONFIG_OK || !supabase) {
      if (!opciones.silencioso) setEstadoNube("Configura Supabase.");
      return;
    }
    const clave = String(syncKey || "").trim();
    if (!clave) return;

    setSincronizando(true);
    if (!opciones.silencioso) setEstadoNube("Buscando datos...");
    const { data, error } = await supabase.from(SUPABASE_TABLE).select("brand, catalog, quote, items").eq("id", clave).maybeSingle();

    if (error) {
      setEstadoNube("No se pudo cargar desde Supabase.");
      setSincronizando(false);
      return;
    }
    if (!data) {
      setEstadoNube(opciones.silencioso ? "" : `No se encontro informacion para "${clave}".`);
      setSincronizando(false);
      return;
    }

    aplicarBorradorRemoto(data, { silencioso: true });
    setEstadoNube(`Cargado desde la nube con "${clave}".`);
    setSincronizando(false);
  }

  async function guardarCotizacionEnviada() {
    if (!SUPABASE_CONFIG_OK || !supabase) { setEstadoNube("Configura Supabase."); return; }
    if (!datos.cliente.trim()) { alert("Indica el nombre del cliente."); return; }
    const clave = String(syncKey || "").trim();
    if (!clave) return;

    setGuardandoCotizacion(true);
    setEstadoNube("Guardando historial...");
    
    // Auto-firmado inteligente basado en la sesion autenticada
    const cotizacionSegura = { ...datos };
    if (authProfile?.role === "vendedor" && authProfile?.vendedor_nombre) {
       cotizacionSegura.vendedor = authProfile.vendedor_nombre;
    }

    const payload = {
      id: generarId(),
      sync_key: clave,
      status: "pendiente",
      brand,
      catalog: catalogo,
      quote: cotizacionSegura,
      items,
      totals: totales,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from(QUOTES_TABLE).insert(payload);
    if (error) {
      setEstadoNube("Error guardando cotizacion.");
    } else {
      registrarNumeroCotizacion(payload.quote?.numeroCotizacion);
      setCotizacionesGuardadas((prev) => [payload, ...prev]);
      setEstadoNube("Cotizacion enviada y guardada en el historial.");
      if (["admin", "historial", "estadisticas"].includes(tabActiva)) cargarPanelAdministrativo();
    }
    setGuardandoCotizacion(false);
  }

  async function cargarPanelAdministrativo() {
    if (!SUPABASE_CONFIG_OK || !supabase) { setMensajeAdmin("Configura Supabase."); return; }
    const clave = String(syncKey || "").trim();
    if (!clave) { setMensajeAdmin("Ingresa una clave para cargar historial."); return; }

    setCargandoAdmin(true);
    setMensajeAdmin("Cargando datos...");
    
    let query = supabase.from(QUOTES_TABLE).select("*").eq("sync_key", clave).order("created_at", { ascending: false });
    
    // Aislacion Multi-Cuenta (Privacidad RBAC)
    if (authProfile && authProfile.role === "vendedor") {
       query = query.eq("quote->>vendedor", authProfile.vendedor_nombre);
    }

    const { data: quotesData, error: quotesError } = await query;

    if (quotesError) {
      setMensajeAdmin("No se pudieron cargar los datos.");
    } else {
      setCotizacionesGuardadas(quotesData || []);
      const maximoCargado = (quotesData || []).reduce((acumulado, registro) => {
        const consecutivo = extraerConsecutivo(registro?.quote?.numeroCotizacion);
        return consecutivo > acumulado ? consecutivo : acumulado;
      }, 0);
      if (maximoCargado > 0) {
        guardarStorage(STORAGE_KEYS.quoteCounter, maximoCargado);
      }
      setMensajeAdmin("Panel actualizado.");
    }
    setCargandoAdmin(false);
  }

  async function eliminarCotizacionGuardada(idRegistro) {
    if (!SUPABASE_CONFIG_OK || !supabase) return;
    const confirmado = window.confirm("Seguro que deseas eliminar el registro del historial?");
    if (!confirmado) return;

    setMensajeAdmin("Eliminando registro y limpiando nube...");
    const { error } = await supabase.from(QUOTES_TABLE).delete().eq("id", idRegistro);
    if (error) {
      setMensajeAdmin("Error al eliminar la cotizacion de la base de datos.");
    } else {
      setMensajeAdmin("Cotizacion eliminada exitosamente.");
      cargarPanelAdministrativo();
    }
  }

  async function actualizarEstatusCRM(idRegistro, nuevoEstado) {
    if (!SUPABASE_CONFIG_OK || !supabase) return;
    setMensajeAdmin(`Moviendo a ${nuevoEstado}...`);
    const { error } = await supabase.from(QUOTES_TABLE).update({ status: nuevoEstado, updated_at: new Date().toISOString() }).eq("id", idRegistro);
    if (error) {
      setMensajeAdmin("No se pudo actualizar el estado.");
    } else {
      setMensajeAdmin(`Cotizacion marcada como ${nuevoEstado}.`);
      setCotizacionesGuardadas((prev) => prev.map((c) => c.id === idRegistro ? { ...c, status: nuevoEstado } : c));
    }
  }

  async function toggleMedidasConfirmadasCRM(idRegistro, valorActual) {
    if (!SUPABASE_CONFIG_OK || !supabase) return;
    const nuevoValor = !valorActual;
    const registro = cotizacionesGuardadas.find(c => c.id === idRegistro);
    if (!registro) return;
    
    setMensajeAdmin("Actualizando conformación de medidas...");
    const quoteModificada = { ...registro.quote, medidasConfirmadas: nuevoValor };
    const { error } = await supabase.from(QUOTES_TABLE).update({ quote: quoteModificada, updated_at: new Date().toISOString() }).eq("id", idRegistro);
    if (error) {
       setMensajeAdmin("No se pudo confirmar medidas.");
    } else {
       setMensajeAdmin(nuevoValor ? "Medidas confirmadas en sistema." : "Medidas desmarcadas.");
       setCotizacionesGuardadas((prev) => prev.map((c) => c.id === idRegistro ? { ...c, quote: quoteModificada } : c));
    }
  }

  function cargarCotizacionGuardada(registro) {
    const catalogoRemoto = Array.isArray(registro.catalog) && registro.catalog.length ? registro.catalog : catalogo;
    setCatalogo(catalogoRemoto);
    setDatos({ ...defaultQuoteData, ...(registro.quote || {}) });
    setItems(Array.isArray(registro.items) ? registro.items : []);
    setCotizacionSeleccionadaId(registro.id);
    setTabActiva("cotizacion");
    setEstadoNube("Cotizacion cargada en pantalla.");
  }

  return {
    tabActiva, setTabActiva,
    brand, setBrand,
    catalogo, setCatalogo,
    datos, setDatos, actualizarDato,
    items, setItems, actualizarItem, agregarItem, eliminarItem, clonarItem,
    nuevoProducto, setNuevoProducto, agregarProducto, eliminarProducto,
    productoEnEdicion, setProductoEnEdicion, iniciarEdicionProducto, cancelarEdicionProducto, guardarEdicionProducto,
    syncKey, setSyncKey, estadoNube, sincronizando, guardarEnNube, cargarDesdeNube,
    guardandoCotizacion, guardarCotizacionEnviada, limpiarCotizacion, manejarLogo,
    cargandoAdmin, cargarPanelAdministrativo, eliminarCotizacionGuardada, actualizarEstatusCRM, toggleMedidasConfirmadasCRM,
    cotizacionesGuardadas, cotizacionesFiltradas, filtroAdmin, setFiltroAdmin, filtroEstatusHistorial, setFiltroEstatusHistorial, cotizacionSeleccionadaId, mensajeAdmin,
    cargarCotizacionGuardada, itemsCalculados, totales
  };
}
