import { defaultQuoteData, defaultOrderMeta } from "./constants";

export function leerStorage(key, fallback) {
  try {
    const guardado = localStorage.getItem(key);
    return guardado ? JSON.parse(guardado) : fallback;
  } catch {
    return fallback;
  }
}

export function guardarStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function formatoDinero(valor) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

function nombreMes(numero) {
  const meses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
  ];
  return meses[numero - 1] || "";
}

export function fechaBonita(valor) {
  if (!valor) return "";
  const [anio, mes, dia] = valor.split("-");
  return `${dia} DE ${nombreMes(Number(mes))} DEL ${anio}`;
}

export function calcularDiasTranscurridos(fechaTexto) {
  if (!fechaTexto) return 0;
  // Intenta parsear fecha (puede venir como YYYY-MM-DD o ISO completa)
  const fecha = new Date(fechaTexto);
  if (isNaN(fecha.getTime())) return 0;
  
  const hoy = new Date();
  // Reseteamos las horas para comparar solo días
  fecha.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);
  
  const diffTiempo = hoy.getTime() - fecha.getTime();
  return Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
}

export function hexToRgb(hex) {
  const limpio = (hex || "#26508C").replace("#", "");
  const normalizado =
    limpio.length === 3
      ? limpio
          .split("")
          .map((c) => c + c)
          .join("")
      : limpio;

  const numero = parseInt(normalizado, 16);
  return [(numero >> 16) & 255, (numero >> 8) & 255, numero & 255];
}

export function crearItem(catalogo) {
  const primero = catalogo[0];
  return {
    catalogId: primero?.id || "",
    descripcion: primero?.nombre || "",
    precio: primero?.precio || 0,
    usaMedidas: primero?.usaMedidas ?? true,
    cantidad: 1,
    ancho: "",
    alto: "",
    observacion: "",
    tonosSeleccionados: [],
  };
}

export function detectarTipoCortina(item, catalogo) {
  const producto = catalogo.find((entry) => entry.id === item.catalogId);
  const texto = `${item.descripcion || ""} ${producto?.categoria || ""}`.toLowerCase();
  if (texto.includes("blackout")) return "Blackout";
  if (texto.includes("screen")) return "Screen";
  return "Otro";
}

export function crearOrdenItem(item, catalogo) {
  return {
    ...item,
    tipoCortina: detectarTipoCortina(item, catalogo),
    ladoControl: "derecha",
    invertida: false,
  };
}

export function crearBorradorOrden({ quoteId = "", datos, items, catalogo, orderId = "" }) {
  return {
    id: orderId,
    meta: {
      ...defaultOrderMeta,
      quoteId,
      cliente: datos.cliente || "",
      fecha: new Date().toISOString().slice(0, 10),
    },
    items: items.map((item) => crearOrdenItem(item, catalogo)),
  };
}

export function mapStoredOrderDraft(raw) {
  if (!raw || typeof raw !== "object") {
    return crearBorradorOrden({
      datos: defaultQuoteData,
      items: [],
      catalogo: [],
    });
  }

  return {
    id: raw.id || "",
    meta: {
      ...defaultOrderMeta,
      ...(raw.meta || {}),
    },
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}

export function calcularItems(items) {
  return items.map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const ancho = Number(item.ancho || 0);
    const alto = Number(item.alto || 0);
    const precio = Number(item.precio || 0);

    const anchoFacturable = item.usaMedidas ? Math.max(ancho, 1) : 1;
    const altoFacturable = item.usaMedidas ? Math.max(alto, 1) : 1;
    const areaReal = item.usaMedidas ? ancho * alto : 1;
    const areaFacturable = item.usaMedidas
      ? anchoFacturable * altoFacturable
      : 1;
    const total = item.usaMedidas
      ? cantidad * areaFacturable * precio
      : cantidad * precio;

    return {
      ...item,
      cantidad,
      ancho,
      alto,
      precio,
      anchoFacturable,
      altoFacturable,
      areaReal,
      areaFacturable,
      total,
    };
  });
}

export function calcularTotales(itemsCalculados, ivaPorcentaje, descuentoPorcentaje) {
  const subtotal = itemsCalculados.reduce((acc, item) => acc + item.total, 0);
  const descuento = subtotal * (Number(descuentoPorcentaje || 0) / 100);
  const subtotalNeto = subtotal - descuento;
  const iva = subtotalNeto * (Number(ivaPorcentaje || 0) / 100);
  const totalFinal = subtotalNeto + iva;

  return { subtotal, descuento, subtotalNeto, iva, totalFinal };
}
