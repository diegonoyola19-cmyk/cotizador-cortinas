import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { hexToRgb, fechaBonita, formatoDinero } from "./helpers";

const TONE_VIEWER_STORAGE_KEY = "cotizador_tone_viewer_v1";

async function crearMiniaturaCircular(src, size = 120) {
  if (typeof window === "undefined") return src;

  const imagen = new Image();
  imagen.src = src;
  await new Promise((resolve, reject) => {
    imagen.onload = resolve;
    imagen.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const escala = Math.max(size / imagen.width, size / imagen.height);
  const drawW = imagen.width * escala;
  const drawH = imagen.height * escala;
  const drawX = (size - drawW) / 2;
  const drawY = (size - drawH) / 2;
  ctx.drawImage(imagen, drawX, drawY, drawW, drawH);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

export async function generarPDFCotizacion({ brand, catalogo = [], datos, itemsCalculados, totales }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const primarioRgb = hexToRgb(brand.colorPrimario);
  const grisOscuro = [30, 41, 59];
  const grisMedio = [100, 116, 139];
  const grisClaro = [226, 232, 240];
  const grisFondo = [247, 249, 252];
  const marginX = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const slogan = brand.slogan || "Detalles que cambian espacios";

  const vendedorActivo = (brand.vendedores || []).find((v) => v.nombre === datos.vendedor);
  const nombreAtiende = vendedorActivo ? vendedorActivo.nombre : (datos.vendedor || brand.atiende || "Nuestro Equipo");
  const telAtiende = vendedorActivo ? vendedorActivo.celular : brand.celular;
  const detectarLineaItem = (item) => {
    const producto = (catalogo || []).find((entry) => entry.id === item?.catalogId);
    if (producto?.lineaTonos) return producto.lineaTonos;
    const texto = `${producto?.nombre || ""} ${producto?.categoria || ""}`.toLowerCase();
    
    if (texto.includes("blackout") || texto.includes("black out")) return "Blackout";
    if (texto.includes("screen")) return "Screen";
    if (texto.includes("attos") || texto.includes("atos") || texto.includes("exterior")) return "Exterior / ATOS";
    return "";
  };
  const lineasEnCotizacion = Array.from(new Set(itemsCalculados.map((item) => detectarLineaItem(item)).filter(Boolean)));
  const tonosAutomaticos = (brand.tonosCatalogo || []).filter((imagen) => lineasEnCotizacion.includes(imagen.linea));
  const imagenesTonos = Array.from(
    new Map(
      [...tonosAutomaticos]
        .filter((imagen) => imagen?.id && imagen?.src)
        .map((imagen) => [imagen.id, imagen])
    ).values()
  );
  const imagenesTonosAgrupadas = imagenesTonos.reduce((acc, imagen) => {
    const linea = imagen.linea || "Sin linea";
    const carpeta = imagen.carpeta || "General";
    if (!acc[linea]) acc[linea] = {};
    if (!acc[linea][carpeta]) acc[linea][carpeta] = [];
    acc[linea][carpeta].push(imagen);
    return acc;
  }, {});

  if (typeof window !== "undefined") {
    const payloadViewer = imagenesTonos.reduce((acc, imagen) => {
      acc[imagen.id] = {
        id: imagen.id,
        nombre: imagen.nombre || "Tono",
        linea: imagen.linea || "",
        carpeta: imagen.carpeta || "",
        src: imagen.src || "",
      };
      return acc;
    }, {});
    window.localStorage.setItem(TONE_VIEWER_STORAGE_KEY, JSON.stringify(payloadViewer));
  }

  const miniaturasCirculares = Object.fromEntries(
    await Promise.all(
      imagenesTonos.map(async (imagen) => {
        try {
          return [imagen.id, await crearMiniaturaCircular(imagen.src)];
        } catch {
          return [imagen.id, imagen.src];
        }
      })
    )
  );

  const drawFittedText = ({
    text,
    x,
    y,
    maxWidth,
    maxLines = 1,
    font = "helvetica",
    style = "normal",
    fontSize = 12,
    minFontSize = 7,
    color = grisOscuro,
    align = "left",
    lineHeight = 1.15,
  }) => {
    let size = fontSize;
    let lines = [];

    while (size >= minFontSize) {
      doc.setFont(font, style);
      doc.setFontSize(size);
      lines = doc.splitTextToSize(String(text || ""), maxWidth);
      if (lines.length <= maxLines) break;
      size -= 0.5;
    }

    doc.setTextColor(...color);
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.text(lines.slice(0, maxLines), x, y, { align, lineHeightFactor: lineHeight, maxWidth });

    return {
      lines: lines.slice(0, maxLines),
      fontSize: size,
    };
  };

  const drawPageFooter = (pageNumber) => {
    doc.setFillColor(...primarioRgb);
    doc.rect(0, pageHeight - 6, pageWidth, 6, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...grisMedio);
    doc.text("Precios expresados en USD. Cotizacion sujeta a validacion final de medidas en sitio.", marginX, pageHeight - 9);
    doc.text(`Pagina ${pageNumber}`, pageWidth - marginX, pageHeight - 9, { align: "right" });
  };

  const drawMainHeader = () => {
    doc.setFillColor(...primarioRgb);
    doc.rect(0, 0, pageWidth, 34, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 34, pageWidth, 2.5, "F");
    doc.setFillColor(232, 238, 247);
    doc.rect(0, 36.5, pageWidth, 4, "F");

    if (brand.logo) {
      try {
        const tipo = brand.logo.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(brand.logo, tipo, marginX, 6, 28, 22);
      } catch (error) {
        console.error("No se pudo cargar el logo en el PDF", error);
      }
    }

    drawFittedText({
      text: brand.empresa || "MEC EL SALVADOR",
      x: pageWidth / 2,
      y: 13.5,
      maxWidth: 118,
      maxLines: 1,
      style: "bold",
      fontSize: 18,
      minFontSize: 8,
      color: [255, 255, 255],
      align: "center",
    });

    drawFittedText({
      text: slogan,
      x: pageWidth / 2,
      y: 19.5,
      maxWidth: 110,
      maxLines: 1,
      style: "italic",
      fontSize: 7.8,
      minFontSize: 6.5,
      color: [214, 223, 238],
      align: "center",
      lineHeight: 1.05,
    });

    drawFittedText({
      text: "PROPUESTA COMERCIAL",
      x: pageWidth / 2,
      y: 27,
      maxWidth: 96,
      maxLines: 1,
      style: "bold",
      fontSize: 12.5,
      minFontSize: 9,
      color: [255, 255, 255],
      align: "center",
    });
  };

  const drawClientCard = (y) => {
    const clienteFit = (() => {
      let size = 13.5;
      let lines = [];

      while (size >= 7.5) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        lines = doc.splitTextToSize((datos.cliente || "Cliente por definir").toUpperCase(), 45);
        if (lines.length <= 2) break;
        size -= 0.5;
      }

      return {
        lines: lines.slice(0, 2),
        fontSize: size,
      };
    })();

    const clienteEnDosLineas = clienteFit.lines.length > 1;
    const cardHeight = clienteEnDosLineas ? 38 : 34;
    const accentHeight = clienteEnDosLineas ? 30 : 26;

    doc.setDrawColor(...grisClaro);
    doc.setFillColor(...grisFondo);
    doc.roundedRect(marginX, y, 180, cardHeight, 4, 4, "FD");

    doc.setFillColor(...primarioRgb);
    doc.roundedRect(marginX + 4, y + 4, 54, accentHeight, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(219, 234, 254);
    doc.text("CLIENTE", marginX + 31, y + 10.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(clienteFit.fontSize);
    doc.setTextColor(255, 255, 255);
    const nombreClienteY = clienteEnDosLineas ? y + 19.5 : y + 20.5;
    doc.text(clienteFit.lines, marginX + 31, nombreClienteY, {
      align: "center",
      maxWidth: 45,
      lineHeightFactor: 1.05,
    });

    const campos = [
      { label: "Fecha", value: fechaBonita(datos.fecha) || "-" },
      { label: "Vigencia", value: datos.vigencia || "15 Dias" },
      { label: "Cotizacion", value: datos.numeroCotizacion || "S/N" },
      { label: "Asesor", value: nombreAtiende || "-" },
    ];

    campos.forEach((campo, index) => {
      const x = marginX + 66 + (index % 2) * 48;
      const yy = y + (clienteEnDosLineas ? 12 : 11) + Math.floor(index / 2) * 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...primarioRgb);
      doc.text(campo.label.toUpperCase(), x, yy);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...grisOscuro);
      const lineas = doc.splitTextToSize(campo.value || "-", 42);
      doc.text(lineas.slice(0, 2), x, yy + 4.6);
    });

    return cardHeight;
  };

  const drawTotalsBlock = (x, y, w) => {
    let current = y;
    const boxHeight = 41 + (totales.descuento > 0 ? 8 : 0);

    doc.setDrawColor(...grisClaro);
    doc.setFillColor(250, 251, 253);
    doc.roundedRect(x, y, w, boxHeight, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primarioRgb);
    doc.text("RESUMEN ECONOMICO", x + 5, current + 6);
    current += 13;

    const drawRow = (label, value, color = grisOscuro, strong = false) => {
      doc.setFont("helvetica", strong ? "bold" : "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...grisMedio);
      doc.text(label, x + 5, current);
      doc.setTextColor(...color);
      doc.text(value, x + w - 5, current, { align: "right" });
      current += 7.5;
    };

    drawRow("Subtotal", formatoDinero(totales.subtotal));
    if (totales.descuento > 0) {
      drawRow(`Descuento (${datos.descuentoPorcentaje || 0}%)`, `-${formatoDinero(totales.descuento)}`, [220, 38, 38], true);
    }
    drawRow(`IVA (${datos.ivaPorcentaje || 13}%)`, formatoDinero(totales.iva));

    doc.setDrawColor(...primarioRgb);
    doc.setLineWidth(0.35);
    doc.line(x + 5, current - 2.5, x + w - 5, current - 2.5);

    doc.setFillColor(...primarioRgb);
    doc.roundedRect(x + 4, current + 1, w - 8, 11, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(222, 234, 253);
    doc.text("TOTAL FINAL", x + 8, current + 8);
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(formatoDinero(totales.totalFinal), x + w - 8, current + 8.5, { align: "right" });
  };

  const drawConditionsBlock = (x, y, w) => {
    doc.setDrawColor(...grisClaro);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, 62, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primarioRgb);
    doc.text("CONDICIONES COMERCIALES", x + 5, y + 8);

    const condiciones = [
      { label: "Forma de pago", value: datos.formaPago || "A convenir" },
      { label: "Tiempo de entrega", value: datos.tiempoEntrega || "A convenir" },
      { label: "Validez", value: datos.vigencia || "15 Dias" },
      { label: "Nota", value: datos.nota || "Sujeto a confirmacion final." },
    ];

    let lineY = y + 16;
    condiciones.forEach((condicion, index) => {
      doc.setFillColor(...primarioRgb);
      doc.circle(x + 7, lineY - 1.2, 1.1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...grisOscuro);
      doc.text(condicion.label, x + 11, lineY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      doc.setTextColor(...grisMedio);
      const lineas = doc.splitTextToSize(condicion.value, w - 18);
      doc.text(lineas, x + 11, lineY + 4.2);
      lineY += index === 3 ? 15 : 11;
    });
  };

  const drawBenefitsBlock = (x, y, w) => {
    doc.setFillColor(242, 246, 252);
    doc.setDrawColor(218, 226, 237);
    doc.roundedRect(x, y, w, 46, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primarioRgb);
    doc.text("VALOR AGREGADO", x + 5, y + 8);

    const beneficios = [
      "Asesoria personalizada para definir la mejor solucion.",
      "Instalacion profesional y acompanamiento durante el proyecto.",
      "Acabados pensados para funcionalidad, imagen y durabilidad.",
    ];

    let benefY = y + 16;
    beneficios.forEach((beneficio) => {
      doc.setFillColor(...primarioRgb);
      doc.roundedRect(x + 5, benefY - 3.4, 4.5, 4.5, 1.2, 1.2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("+", x + 7.25, benefY - 0.15, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      doc.setTextColor(...grisOscuro);
      const lineas = doc.splitTextToSize(beneficio, w - 18);
      doc.text(lineas, x + 13, benefY);
      benefY += 10.5;
    });
  };

  const drawClosingBlock = (x, y, w) => {
    doc.setFillColor(...primarioRgb);
    doc.roundedRect(x, y, w, 33, 5, 5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("Gracias por considerar nuestra propuesta", x + 6, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(227, 233, 243);
    const cierre = doc.splitTextToSize(
      "Quedamos atentos para confirmar medidas, detalles finales y programacion del proyecto segun su conveniencia.",
      w - 12
    );
    doc.text(cierre, x + 6, y + 15);

    doc.setDrawColor(255, 255, 255);
    doc.line(x + 6, y + 23.5, x + w - 6, y + 23.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(nombreAtiende, x + 6, y + 28.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    const contacto = `${telAtiende ? `Tel. ${telAtiende}` : ""}` || "Contacto disponible";
    doc.text(contacto, x + w - 6, y + 28.5, { align: "right" });
  };

  const drawToneGallery = (startY) => {
    if (!imagenesTonos.length) return startY;

    let currentY = startY;
    const swatchSize = 14;
    const swatchGap = 3;
    const labelGap = 6;
    const viewerBaseUrl =
      typeof window !== "undefined"
        ? new URL("/tono-viewer.html", window.location.origin).toString()
        : "";

    const ensureSpace = (neededHeight, resetTo = 20) => {
      if (currentY + neededHeight <= pageHeight - 16) return;
      doc.addPage();
      drawPageFooter(doc.internal.getNumberOfPages());
      currentY = resetTo;
    };

    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primarioRgb);
    doc.text("TONOS DISPONIBLES", marginX, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    doc.setTextColor(...grisMedio);
    doc.text("Presione un tono para abrir su imagen completa en una pagina externa.", marginX, currentY);
    currentY += 7;

    Object.entries(imagenesTonosAgrupadas).forEach(([linea, carpetas]) => {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.6);
      doc.setTextColor(...primarioRgb);
      doc.text(linea.toUpperCase(), marginX, currentY);
      currentY += 4.5;
      doc.setDrawColor(...grisClaro);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 3;

      Object.entries(carpetas).forEach(([carpeta, tonos]) => {
        ensureSpace(12 + swatchSize);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.8);
        doc.setTextColor(...grisMedio);
        doc.text(carpeta, marginX, currentY);
        currentY += 2.5;

        const maxVisible = Math.max(1, Math.floor((pageWidth - marginX * 2) / (swatchSize + swatchGap)));
        let currentX = marginX;
        tonos.slice(0, maxVisible).forEach((imagen) => {
          const y = currentY;
          try {
            const thumbSrc = miniaturasCirculares[imagen.id] || imagen.src;
            doc.addImage(thumbSrc, "PNG", currentX, y, swatchSize, swatchSize);
          } catch (error) {
            console.error("No se pudo cargar una imagen de tono en el PDF", error);
          }
          doc.setDrawColor(...grisClaro);
          doc.setLineWidth(0.5);
          doc.circle(currentX + swatchSize / 2, y + swatchSize / 2, swatchSize / 2, "S");

          if (viewerBaseUrl) {
            const url = `${viewerBaseUrl}?id=${encodeURIComponent(imagen.id)}`;
            doc.link(currentX, y, swatchSize, swatchSize, { url });
          }

          currentX += swatchSize + swatchGap;
        });

        if (tonos.length > maxVisible) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(...grisMedio);
          doc.text(`+${tonos.length - maxVisible}`, pageWidth - marginX, currentY + 9, { align: "right" });
        }

        currentY += swatchSize + labelGap;
      });
    });
    return currentY;
  };

  drawMainHeader();
  let currentY = 47;
  const clientCardHeight = drawClientCard(currentY);
  currentY += clientCardHeight + 8;

  const itemsOrdenados = [...itemsCalculados].sort((a, b) => {
    if (a.usaMedidas === b.usaMedidas) return 0;
    return a.usaMedidas ? -1 : 1;
  });

  autoTable(doc, {
    startY: currentY,
    head: [["Cantidad", "Producto / Detalle", "Metros cuadrados", "Total"]],
    body: itemsOrdenados.map((item) => [
      String(item.cantidad || 0),
      item.descripcion || "",
      item.usaMedidas ? `${Number(item.areaFacturable || 0).toFixed(2)} m2` : "No aplica",
      formatoDinero(item.total),
    ]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.6,
      cellPadding: { top: 4.5, right: 3.5, bottom: 4.5, left: 3.5 },
      textColor: grisOscuro,
      lineColor: grisClaro,
      lineWidth: { bottom: 0.18 },
      valign: "middle",
    },
    headStyles: {
      fillColor: primarioRgb,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      lineColor: primarioRgb,
      lineWidth: 0,
      minCellHeight: 10,
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 22 },
      1: { cellWidth: 93 },
      2: { halign: "center", cellWidth: 32 },
      3: { halign: "right", cellWidth: 28, fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "head" && hookData.column.index === 1) {
        hookData.cell.styles.halign = "left";
      }
      if (hookData.section === "head" && hookData.column.index === 3) {
        hookData.cell.styles.halign = "right";
      }
      if (hookData.section === "body" && hookData.column.index === 1) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.halign = "left";
      }
      if (hookData.section === "body" && hookData.column.index === 3) {
        hookData.cell.styles.halign = "right";
      }
    },
    didDrawCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 1) {
        const item = itemsOrdenados[hookData.row.index];
        const textoSecundario = item?.observacion
          ? `Detalle: ${item.observacion}`
          : item?.usaMedidas
            ? `Modelo a la medida`
            : "Servicio o cargo fijo";

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...grisMedio);
        doc.text(textoSecundario, hookData.cell.x + 3.5, hookData.cell.y + hookData.cell.height - 2.5, {
          maxWidth: hookData.cell.width - 6,
        });
      }
    },
    margin: { left: marginX, right: marginX },
  });

  const totalPagesAfterTable = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPagesAfterTable; page += 1) {
    doc.setPage(page);
    drawPageFooter(page);
  }

  doc.setPage(totalPagesAfterTable);
  currentY = (doc.lastAutoTable?.finalY || 120) + 10;
  const requiredHeight = 77;

  if (currentY + requiredHeight > pageHeight - 18) {
    doc.addPage();
    drawPageFooter(doc.internal.getNumberOfPages());
    currentY = 20;
  }

  drawConditionsBlock(marginX, currentY, 108);
  drawTotalsBlock(130, currentY, 65);

  let nextY = currentY + 70;
  if (nextY + 84 > pageHeight - 16) {
    doc.addPage();
    drawPageFooter(doc.internal.getNumberOfPages());
    nextY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primarioRgb);
  doc.text("PROPUESTA DE VALOR", marginX, nextY - 4);
  drawBenefitsBlock(marginX, nextY, 86);
  drawClosingBlock(106, nextY, 89);
  nextY = drawToneGallery(nextY + 52);

  const nombreArchivo = `${(datos.numeroCotizacion || "COT").replace(/\s+/g, "_")}_${(datos.cliente || "cliente").replace(/\s+/g, "_")}.pdf`;
  doc.save(nombreArchivo);
}

export function generarPDFOrdenTrabajo({ borradorOrden, brand, itemsOrdenCalculados, totalesOrden }) {
  if (!borradorOrden.meta.quoteId) {
    alert("Selecciona una cotizacion antes de generar la orden.");
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const color = hexToRgb(brand.colorPrimario);

  doc.setFillColor(...color);
  doc.rect(0, 0, 210, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ORDEN DE TRABAJO", 14, 15);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Cliente: ${borradorOrden.meta.cliente || "-"}`, 14, 34);
  doc.text(`Fecha: ${fechaBonita(borradorOrden.meta.fecha)}`, 14, 42);
  doc.text(`Responsable: ${borradorOrden.meta.responsable || "-"}`, 14, 50);
  doc.text(`Entrega estimada: ${borradorOrden.meta.entregaEstimada || "-"}`, 110, 50);

  autoTable(doc, {
    startY: 60,
    head: [["Cant.", "Producto", "Medidas", "Tipo", "Control", "Invertida"]],
    body: itemsOrdenCalculados.map((item) => [
      String(item.cantidad || 0),
      item.descripcion || "",
      item.usaMedidas
        ? `${Number(item.ancho || 0).toFixed(2)} x ${Number(item.alto || 0).toFixed(2)} m`
        : "No aplica",
      item.tipoCortina || "Otro",
      item.ladoControl || "-",
      item.invertida ? "Si" : "No",
    ]),
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: color },
    margin: { left: 14, right: 14 },
  });

  const yTabla = doc.lastAutoTable?.finalY || 100;
  doc.setFont("helvetica", "bold");
  doc.text(`Total referencia: ${formatoDinero(totalesOrden.totalFinal)}`, 14, yTabla + 12);
  doc.setFont("helvetica", "normal");
  doc.text(`Notas: ${borradorOrden.meta.notas || "-"}`, 14, yTabla + 22);

  const nombreArchivo = `orden_trabajo_${(borradorOrden.meta.cliente || "cliente").replace(/\s+/g, "_")}.pdf`;
  doc.save(nombreArchivo);
}
