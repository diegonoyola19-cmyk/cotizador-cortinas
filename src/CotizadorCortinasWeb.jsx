import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Plus, Trash2, Pencil } from "lucide-react";

const STORAGE_KEYS = {
  brand: "cotizador_brand_v5",
  catalog: "cotizador_catalog_v5",
  quote: "cotizador_quote_v5",
  items: "cotizador_items_v5",
};

function generarId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultBrand = {
  empresa: "Tu Empresa de Cortinas",
  atiende: "CATTY JIMENEZ",
  celular: "7741-1870",
  correo: "mecelsalvador503@gmail.com",
  direccion: "",
  colorPrimario: "#1e293b",
  colorSecundario: "#e2e8f0",
  logo: "",
};

const defaultQuoteData = {
  fecha: new Date().toISOString().slice(0, 10),
  cliente: "",
  formaPago: "50% Anticipo, 50% contraentrega",
  tiempoEntrega: "A convenir",
  nota: "TONO A DEFINIR",
  ivaPorcentaje: 13,
};

const defaultCatalog = [
  {
    id: generarId(),
    nombre: "CORTINA ATTOS EN SCREEN 3000/3 PARA EXTERIOR",
    categoria: "Screen",
    precio: 120,
    usaMedidas: true,
  },
  {
    id: generarId(),
    nombre: "CORTINA BLACKOUT",
    categoria: "Blackout",
    precio: 95,
    usaMedidas: true,
  },
  {
    id: generarId(),
    nombre: "CARGOS POR FLETE",
    categoria: "Cargo",
    precio: 25,
    usaMedidas: false,
  },
];

function leerStorage(key, fallback) {
  try {
    const guardado = localStorage.getItem(key);
    return guardado ? JSON.parse(guardado) : fallback;
  } catch {
    return fallback;
  }
}

function formatoDinero(valor) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

function nombreMes(numero) {
  const meses = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];
  return meses[numero - 1] || "";
}

function fechaBonita(valor) {
  if (!valor) return "";
  const [anio, mes, dia] = valor.split("-");
  return `${dia} DE ${nombreMes(Number(mes))} DEL ${anio}`;
}

function hexToRgb(hex) {
  const limpio = (hex || "#1e293b").replace("#", "");
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

function crearItem(catalogo) {
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
  };
}

export default function CotizadorCortinasWeb() {
  const [tabActiva, setTabActiva] = useState("cotizacion");

  const [brand, setBrand] = useState(() =>
    leerStorage(STORAGE_KEYS.brand, defaultBrand)
  );

  const [catalogo, setCatalogo] = useState(() => {
    const guardado = leerStorage(STORAGE_KEYS.catalog, defaultCatalog);
    return Array.isArray(guardado) && guardado.length ? guardado : defaultCatalog;
  });

  const [datos, setDatos] = useState(() =>
    leerStorage(STORAGE_KEYS.quote, defaultQuoteData)
  );

  const [items, setItems] = useState(() => {
    const guardados = leerStorage(STORAGE_KEYS.items, null);
    return Array.isArray(guardados) && guardados.length
      ? guardados
      : [crearItem(catalogo)];
  });

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    categoria: "",
    precio: "",
    usaMedidas: true,
  });

  const [productoEnEdicion, setProductoEnEdicion] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.brand, JSON.stringify(brand));
  }, [brand]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(catalogo));
  }, [catalogo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.quote, JSON.stringify(datos));
  }, [datos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
  }, [items]);

  function actualizarDato(campo, valor) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function actualizarItem(index, campo, valor) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        if (campo === "catalogId") {
          const producto = catalogo.find((p) => p.id === valor);
          return {
            ...item,
            catalogId: valor,
            descripcion: producto?.nombre || "",
            precio: producto?.precio || 0,
            usaMedidas: producto?.usaMedidas ?? true,
            ancho: producto?.usaMedidas ? item.ancho : "",
            alto: producto?.usaMedidas ? item.alto : "",
          };
        }

        return { ...item, [campo]: valor };
      })
    );
  }

  function agregarItem() {
    setItems((prev) => [crearItem(catalogo), ...prev]);
  }

  function eliminarItem(index) {
    const nuevos = items.filter((_, i) => i !== index);
    setItems(nuevos.length ? nuevos : [crearItem(catalogo)]);
  }

  function limpiarCotizacion() {
    const confirmado = window.confirm("¿Deseas limpiar la cotización actual?");
    if (!confirmado) return;

    const nuevaCotizacion = {
      ...defaultQuoteData,
      fecha: new Date().toISOString().slice(0, 10),
    };

    setDatos(nuevaCotizacion);
    setItems([crearItem(catalogo)]);
    localStorage.setItem(STORAGE_KEYS.quote, JSON.stringify(nuevaCotizacion));
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify([crearItem(catalogo)]));
  }

  function agregarProducto() {
    if (!nuevoProducto.nombre.trim()) return;

    const nuevo = {
      id: generarId(),
      nombre: nuevoProducto.nombre.trim(),
      categoria: nuevoProducto.categoria.trim(),
      precio: Number(nuevoProducto.precio || 0),
      usaMedidas: nuevoProducto.usaMedidas,
    };

    setCatalogo((prev) => [...prev, nuevo]);
    setNuevoProducto({
      nombre: "",
      categoria: "",
      precio: "",
      usaMedidas: true,
    });
  }

  function eliminarProducto(id) {
    if (catalogo.length <= 1) {
      alert("Debes dejar al menos un producto en el catálogo.");
      return;
    }

    const nuevos = catalogo.filter((p) => p.id !== id);
    setCatalogo(nuevos);

    setItems((prev) =>
      prev.map((item) => {
        if (item.catalogId !== id) return item;
        const primero = nuevos[0];
        return {
          ...item,
          catalogId: primero.id,
          descripcion: primero.nombre,
          precio: primero.precio,
          usaMedidas: primero.usaMedidas,
          ancho: primero.usaMedidas ? item.ancho : "",
          alto: primero.usaMedidas ? item.alto : "",
        };
      })
    );

    if (productoEnEdicion?.id === id) {
      setProductoEnEdicion(null);
    }
  }

  function iniciarEdicionProducto(producto) {
    setProductoEnEdicion({ ...producto });
  }

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
            }
          : producto
      )
    );

    setItems((prev) =>
      prev.map((item) => {
        if (item.catalogId !== productoEnEdicion.id) return item;

        return {
          ...item,
          descripcion: productoEnEdicion.nombre.trim(),
          precio: Number(productoEnEdicion.precio || 0),
          usaMedidas: productoEnEdicion.usaMedidas,
          ancho: productoEnEdicion.usaMedidas ? item.ancho : "",
          alto: productoEnEdicion.usaMedidas ? item.alto : "",
        };
      })
    );

    setProductoEnEdicion(null);
  }

  function cancelarEdicionProducto() {
    setProductoEnEdicion(null);
  }

  function manejarLogo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBrand((prev) => ({
        ...prev,
        logo: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(archivo);
  }

  const itemsCalculados = useMemo(() => {
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
  }, [items]);

  const totales = useMemo(() => {
    const subtotal = itemsCalculados.reduce((acc, item) => acc + item.total, 0);
    const iva = subtotal * (Number(datos.ivaPorcentaje || 0) / 100);
    const totalFinal = subtotal + iva;

    return {
      subtotal,
      iva,
      totalFinal,
    };
  }, [itemsCalculados, datos.ivaPorcentaje]);

  function generarPDF() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const colorPrimario = hexToRgb(brand.colorPrimario);

    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, 210, 28, "F");

    if (brand.logo) {
      try {
        const tipo = brand.logo.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(brand.logo, tipo, 14, 5, 22, 16);
      } catch (error) {
        console.error("No se pudo cargar el logo en el PDF", error);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text((brand.empresa || "COTIZACIÓN").toUpperCase(), 42, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha ${fechaBonita(datos.fecha)}`, 150, 11);
    doc.text(`Cliente: ${(datos.cliente || "-").toUpperCase()}`, 150, 18);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text((datos.cliente || "CLIENTE").toUpperCase(), 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [["Cant.", "Item", "Medidas", "M² Fact.", "Precio", "Total"]],
      body: itemsCalculados.map((item) => [
        String(item.cantidad || 0),
        item.descripcion || "",
        item.usaMedidas
          ? `${Number(item.ancho || 0).toFixed(2)} x ${Number(item.alto || 0).toFixed(2)} m`
          : "No aplica",
        item.usaMedidas ? Number(item.areaFacturable || 0).toFixed(2) : "-",
        formatoDinero(item.precio),
        formatoDinero(item.total),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: colorPrimario,
      },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 74 },
        2: { cellWidth: 34 },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 28, halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });

    const yTabla = doc.lastAutoTable?.finalY || 110;

    if (datos.nota) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text((datos.nota || "").toUpperCase(), 14, yTabla + 10);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Subtotal", 145, yTabla + 10);
    doc.text("IVA", 145, yTabla + 18);
    doc.text("Total", 145, yTabla + 26);

    doc.setFont("helvetica", "normal");
    doc.text(formatoDinero(totales.subtotal), 196, yTabla + 10, { align: "right" });
    doc.text(formatoDinero(totales.iva), 196, yTabla + 18, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatoDinero(totales.totalFinal), 196, yTabla + 26, { align: "right" });

    const yInfo = yTabla + 44;

    doc.setFont("helvetica", "bold");
    doc.text("Cliente", 14, yInfo);
    doc.text("Atiende", 78, yInfo);

    doc.setFont("helvetica", "normal");
    doc.text(datos.cliente || "-", 14, yInfo + 8);
    doc.text(brand.atiende || "-", 78, yInfo + 8);

    doc.setFont("helvetica", "bold");
    doc.text("Forma de pago", 14, yInfo + 20);
    doc.text("Tiempo de entrega", 14, yInfo + 30);

    doc.setFont("helvetica", "normal");
    doc.text(datos.formaPago || "-", 48, yInfo + 20);
    doc.text(datos.tiempoEntrega || "-", 52, yInfo + 30);
    doc.text(`Cel: ${brand.celular || "-"}`, 14, yInfo + 42);
    doc.text(`Correo: ${brand.correo || "-"}`, 88, yInfo + 42);

    if (brand.direccion) {
      doc.text(`Dirección: ${brand.direccion}`, 14, yInfo + 50);
    }

    const nombreArchivo = `${(datos.cliente || "cotizacion").replace(/\s+/g, "_")}.pdf`;
    doc.save(nombreArchivo);
  }

  function generarPDFEstiloReferencia() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const azul = hexToRgb(brand.colorPrimario);
    const grisTexto = [63, 86, 122];
    const rojo = [220, 38, 38];
    const margenDerecho = 184;

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(...azul);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Fecha", 24, 20);
    doc.text("Cliente", 132, 20);
    doc.text("ATIENDE", 132, 46);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(fechaBonita(datos.fecha) || "-", 38, 20);
    doc.text((datos.cliente || "-").toUpperCase(), 132, 28);
    doc.text((brand.atiende || "-").toUpperCase(), 132, 54);

    if (brand.logo) {
      try {
        const tipo = brand.logo.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(brand.logo, tipo, 22, 28, 56, 34);
      } catch (error) {
        console.error("No se pudo cargar el logo en el PDF", error);
      }
    } else {
      doc.setDrawColor(...azul);
      doc.rect(22, 28, 56, 34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text((brand.empresa || "LOGO").toUpperCase(), 50, 47, {
        align: "center",
      });
    }

    autoTable(doc, {
      startY: 82,
      head: [["Cantidad", "ITEM", "M²", "Precio U", "Total"]],
      body: itemsCalculados.map((item) => [
        String(item.cantidad || 0),
        item.observacion
          ? `${item.descripcion || ""}\n${item.observacion}`
          : item.descripcion || "",
        item.usaMedidas ? Number(item.areaFacturable || 0).toFixed(2) : "-",
        formatoDinero(item.precio),
        formatoDinero(item.total),
      ]),
      theme: "plain",
      styles: {
        fontSize: 8.5,
        textColor: [25, 25, 25],
        cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        overflow: "linebreak",
      },
      headStyles: {
        fontStyle: "bold",
        textColor: azul,
      },
      columnStyles: {
        0: { cellWidth: 24, halign: "center" },
        1: { cellWidth: 74 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 24, halign: "right" },
      },
      margin: { left: 22, right: 20 },
      didParseCell: (hookData) => {
        hookData.cell.styles.lineWidth = 0;
      },
    });

    const yTabla = doc.lastAutoTable?.finalY || 150;
    const notaY = yTabla + 14;

    if (datos.nota) {
      doc.setTextColor(...rojo);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text((datos.nota || "").toUpperCase(), 58, notaY);
    }

    const resumenY = Math.max(notaY + 25, 210);
    doc.setTextColor(...azul);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL", 152, resumenY);
    doc.text("IVA", 152, resumenY + 8);
    doc.text("Total", 152, resumenY + 16);
    doc.text("$", 164, resumenY);
    doc.text("$", 164, resumenY + 8);
    doc.text("$", 164, resumenY + 16);
    doc.text(
      formatoDinero(totales.subtotal).replace("USD", "").trim(),
      margenDerecho,
      resumenY,
      { align: "right" }
    );
    doc.text(
      formatoDinero(totales.iva).replace("USD", "").trim(),
      margenDerecho,
      resumenY + 8,
      { align: "right" }
    );
    doc.text(
      formatoDinero(totales.totalFinal).replace("USD", "").trim(),
      margenDerecho,
      resumenY + 16,
      { align: "right" }
    );

    const pagoY = 235;
    doc.setTextColor(...rojo);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Forma de pago", 24, pagoY);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(datos.formaPago || "-", 58, pagoY);

    const pieY = 255;
    doc.setTextColor(...grisTexto);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(
      `Tiempo de entrega ${String(datos.tiempoEntrega || "-").toLowerCase()}`,
      24,
      pieY
    );

    doc.setFont("helvetica", "normal");
    doc.text(`Cel: ${brand.celular || "-"}`, 88, pieY - 6);
    doc.text(`Correo : ${brand.correo || "-"}`, 72, pieY);

    if (brand.direccion) {
      const direccionLineas = doc.splitTextToSize(brand.direccion, 80);
      doc.text(direccionLineas, 72, pieY + 6);
    }

    const nombreArchivo = `${(datos.cliente || "cotizacion").replace(/\s+/g, "_")}.pdf`;
    doc.save(nombreArchivo);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Cotizador de cortinas
              </h1>
              <p className="mt-2 text-slate-600">
                Incluye catálogo administrable, lista desplegable, logo, colores,
                limpieza de cotización, edición de productos y cálculo con ancho
                mínimo facturable de 1 metro.
              </p>
            </div>

            <div className="flex gap-2">
              <TabButton
                activo={tabActiva === "cotizacion"}
                onClick={() => setTabActiva("cotizacion")}
              >
                Cotización
              </TabButton>

              <TabButton
                activo={tabActiva === "admin"}
                onClick={() => setTabActiva("admin")}
              >
                Administrador
              </TabButton>
            </div>
          </div>
        </div>

        {tabActiva === "cotizacion" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Panel titulo="Encabezado de la cotización">
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo
                    label="Fecha"
                    type="date"
                    value={datos.fecha}
                    onChange={(v) => actualizarDato("fecha", v)}
                  />
                  <Campo
                    label="Cliente"
                    value={datos.cliente}
                    onChange={(v) => actualizarDato("cliente", v)}
                  />
                  <Campo
                    label="Forma de pago"
                    value={datos.formaPago}
                    onChange={(v) => actualizarDato("formaPago", v)}
                  />
                  <Campo
                    label="Tiempo de entrega"
                    value={datos.tiempoEntrega}
                    onChange={(v) => actualizarDato("tiempoEntrega", v)}
                  />
                  <Campo
                    label="IVA (%)"
                    type="number"
                    value={datos.ivaPorcentaje}
                    onChange={(v) => actualizarDato("ivaPorcentaje", v)}
                  />
                  <Campo
                    label="Nota"
                    value={datos.nota}
                    onChange={(v) => actualizarDato("nota", v)}
                  />
                </div>
              </Panel>

              <Panel titulo="Items de la cotización">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <p className="text-sm text-slate-500">
                    Si el ancho o el alto es menor a 1 metro, el sistema lo
                    factura como 1.00 m. Ejemplo: 0.80 x 0.70 se cobra como
                    1.00 m² facturables.
                  </p>

                  <button
                    onClick={agregarItem}
                    className="rounded-xl px-4 py-2 text-white"
                    style={{ backgroundColor: brand.colorPrimario }}
                  >
                    Agregar item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => {
                    const calculado = itemsCalculados[index];

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-semibold">Item {index + 1}</h3>

                          <button
                            onClick={() => eliminarItem(index)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Producto
                            </label>
                            <select
                              value={item.catalogId}
                              onChange={(e) =>
                                actualizarItem(index, "catalogId", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-300 px-3 py-2"
                            >
                              {catalogo.map((producto) => (
                                <option key={producto.id} value={producto.id}>
                                  {producto.nombre}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Campo
                            label="Cantidad"
                            type="number"
                            value={item.cantidad}
                            onChange={(v) => actualizarItem(index, "cantidad", v)}
                          />

                          {item.usaMedidas ? (
                            <>
                              <Campo
                                label="Ancho (m)"
                                type="number"
                                value={item.ancho}
                                onChange={(v) => actualizarItem(index, "ancho", v)}
                              />
                              <Campo
                                label="Alto (m)"
                                type="number"
                                value={item.alto}
                                onChange={(v) => actualizarItem(index, "alto", v)}
                              />
                            </>
                          ) : (
                            <div className="xl:col-span-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
                              Este producto no usa medidas. El sistema toma el valor base
                              del producto.
                            </div>
                          )}

                          <Campo
                            label={item.usaMedidas ? "Precio por m²" : "Precio base"}
                            type="number"
                            value={item.precio}
                            onChange={(v) => actualizarItem(index, "precio", v)}
                          />

                          <div className="xl:col-span-3">
                            <Campo
                              label="Observación"
                              value={item.observacion}
                              onChange={(v) =>
                                actualizarItem(index, "observacion", v)
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <CajaResumen
                            label="Área real"
                            valor={
                              item.usaMedidas
                                ? `${calculado.areaReal.toFixed(2)} m²`
                                : "No aplica"
                            }
                            color={brand.colorSecundario}
                          />

                          <CajaResumen
                            label="Ancho facturable"
                            valor={
                              item.usaMedidas
                                ? `${calculado.anchoFacturable.toFixed(2)} m`
                                : "No aplica"
                            }
                            color={brand.colorSecundario}
                          />

                          <CajaResumen
                            label="Alto facturable"
                            valor={
                              item.usaMedidas
                                ? `${calculado.altoFacturable.toFixed(2)} m`
                                : "No aplica"
                            }
                            color={brand.colorSecundario}
                          />

                          <CajaResumen
                            label="Área facturable"
                            valor={
                              item.usaMedidas
                                ? `${calculado.areaFacturable.toFixed(2)} m²`
                                : "-"
                            }
                            color={brand.colorSecundario}
                          />

                          <CajaResumen
                            label="Total"
                            valor={formatoDinero(calculado.total)}
                            color={brand.colorSecundario}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel titulo="Marca y contacto">
                <div className="space-y-4">
                  <Campo
                    label="Empresa"
                    value={brand.empresa}
                    onChange={(v) =>
                      setBrand((prev) => ({ ...prev, empresa: v }))
                    }
                  />

                  <Campo
                    label="Atiende"
                    value={brand.atiende}
                    onChange={(v) =>
                      setBrand((prev) => ({ ...prev, atiende: v }))
                    }
                  />

                  <Campo
                    label="Celular"
                    value={brand.celular}
                    onChange={(v) =>
                      setBrand((prev) => ({ ...prev, celular: v }))
                    }
                  />

                  <Campo
                    label="Correo"
                    value={brand.correo}
                    onChange={(v) =>
                      setBrand((prev) => ({ ...prev, correo: v }))
                    }
                  />

                  <Campo
                    label="Dirección"
                    value={brand.direccion}
                    onChange={(v) =>
                      setBrand((prev) => ({ ...prev, direccion: v }))
                    }
                  />

                  <Campo
                    label="Color principal"
                    type="color"
                    value={brand.colorPrimario}
                    onChange={(v) =>
                      setBrand((prev) => ({ ...prev, colorPrimario: v }))
                    }
                  />

                  <Campo
                    label="Color secundario"
                    type="color"
                    value={brand.colorSecundario}
                    onChange={(v) =>
                      setBrand((prev) => ({ ...prev, colorSecundario: v }))
                    }
                  />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={manejarLogo}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt="Logo"
                        className="mt-3 h-20 rounded-lg border bg-white p-2"
                      />
                    ) : null}
                  </div>
                </div>
              </Panel>

              <Panel titulo="Resumen">
                <div className="space-y-3">
                  <FilaResumen
                    label="Subtotal"
                    valor={formatoDinero(totales.subtotal)}
                  />
                  <FilaResumen label="IVA" valor={formatoDinero(totales.iva)} />
                  <div className="border-t pt-3">
                    <FilaResumen
                      label="Total final"
                      valor={formatoDinero(totales.totalFinal)}
                      fuerte
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={limpiarCotizacion}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700"
                  >
                    Limpiar cotización
                  </button>

                  <button
                    onClick={generarPDFEstiloReferencia}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-white"
                    style={{ backgroundColor: brand.colorPrimario }}
                  >
                    <FileText size={18} />
                    Generar PDF
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Panel titulo="Nuevo producto del catálogo">
                <div className="space-y-4">
                  <Campo
                    label="Nombre"
                    value={nuevoProducto.nombre}
                    onChange={(v) =>
                      setNuevoProducto((prev) => ({ ...prev, nombre: v }))
                    }
                  />

                  <Campo
                    label="Categoría"
                    value={nuevoProducto.categoria}
                    onChange={(v) =>
                      setNuevoProducto((prev) => ({ ...prev, categoria: v }))
                    }
                  />

                  <Campo
                    label="Precio por m² o precio base"
                    type="number"
                    value={nuevoProducto.precio}
                    onChange={(v) =>
                      setNuevoProducto((prev) => ({ ...prev, precio: v }))
                    }
                  />

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={nuevoProducto.usaMedidas}
                      onChange={(e) =>
                        setNuevoProducto((prev) => ({
                          ...prev,
                          usaMedidas: e.target.checked,
                        }))
                      }
                    />
                    Este producto usa ancho y alto
                  </label>

                  <button
                    onClick={agregarProducto}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-white"
                    style={{ backgroundColor: brand.colorPrimario }}
                  >
                    <Plus size={18} />
                    Guardar producto
                  </button>
                </div>
              </Panel>
            </div>

            <div className="lg:col-span-2">
              <Panel titulo="Productos disponibles">
                <div className="space-y-3">
                  {catalogo.map((producto) => {
                    const editando = productoEnEdicion?.id === producto.id;

                    return (
                      <div
                        key={producto.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        {editando ? (
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <Campo
                                label="Nombre"
                                value={productoEnEdicion.nombre}
                                onChange={(v) =>
                                  setProductoEnEdicion((prev) => ({
                                    ...prev,
                                    nombre: v,
                                  }))
                                }
                              />

                              <Campo
                                label="Categoría"
                                value={productoEnEdicion.categoria}
                                onChange={(v) =>
                                  setProductoEnEdicion((prev) => ({
                                    ...prev,
                                    categoria: v,
                                  }))
                                }
                              />

                              <Campo
                                label="Precio"
                                type="number"
                                value={productoEnEdicion.precio}
                                onChange={(v) =>
                                  setProductoEnEdicion((prev) => ({
                                    ...prev,
                                    precio: v,
                                  }))
                                }
                              />

                              <label className="flex items-center gap-2 pt-7 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={productoEnEdicion.usaMedidas}
                                  onChange={(e) =>
                                    setProductoEnEdicion((prev) => ({
                                      ...prev,
                                      usaMedidas: e.target.checked,
                                    }))
                                  }
                                />
                                Este producto usa ancho y alto
                              </label>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={guardarEdicionProducto}
                                className="rounded-lg px-4 py-2 text-white"
                                style={{ backgroundColor: brand.colorPrimario }}
                              >
                                Guardar cambios
                              </button>

                              <button
                                onClick={cancelarEdicionProducto}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {producto.nombre}
                              </div>
                              <div className="text-sm text-slate-500">
                                {producto.categoria || "Sin categoría"} ·{" "}
                                {producto.usaMedidas ? "Con medidas" : "Sin medidas"}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-medium">
                                {formatoDinero(producto.precio)}
                              </span>

                              <button
                                onClick={() => iniciarEdicionProducto(producto)}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>

                              <button
                                onClick={() => eliminarProducto(producto.id)}
                                className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ titulo, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">{titulo}</h2>
      {children}
    </div>
  );
}

function TabButton({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium ${
        activo ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function Campo({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
      />
    </div>
  );
}

function FilaResumen({ label, valor, fuerte = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className={fuerte ? "font-bold text-slate-900" : "text-slate-600"}>
        {label}
      </span>
      <span className={fuerte ? "text-lg font-bold text-slate-900" : "font-medium"}>
        {valor}
      </span>
    </div>
  );
}

function CajaResumen({ label, valor, color = "#f1f5f9" }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: color }}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{valor}</div>
    </div>
  );
}
