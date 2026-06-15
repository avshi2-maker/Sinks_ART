// src/app/api/supplier-offers/[id]/docx/route.ts
// Word (.docx) DRAFT price offer FROM a captured supplier offer (e.g. Ales) -> for Ales to rebrand and send.
// Full RTL, final price (VAT included). No Avshi logo, no commission. Mirrors the quotes DOCX house style.

import { NextRequest, NextResponse } from 'next/server';
import { fetchSupplierOffer } from '@/lib/suppliers/suppliersData';
import JSZip from 'jszip';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType,
} from 'docx';

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text: string, width: number, opts: { bold?: boolean; fill?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ alignment: opts.align || AlignmentType.RIGHT, bidirectional: true, children: [new TextRun({ text, bold: opts.bold, font: 'Arial', size: 20 })] })],
  });
}

function pRtl(text: string, opts: { bold?: boolean; size?: number; after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; color?: string; italics?: boolean } = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: opts.align || AlignmentType.RIGHT,
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, color: opts.color, font: 'Arial', size: opts.size ?? 22 })],
  });
}

function ddmmyyyy(): string {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear();
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await fetchSupplierOffer(id);
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const items = Array.isArray(offer.line_items) ? offer.line_items : [];
  const COLS = [7000, 2360];

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell('תיאור', COLS[0], { bold: true, fill: 'E8E8E8' }),
      cell('מחיר', COLS[1], { bold: true, fill: 'E8E8E8', align: AlignmentType.CENTER }),
    ],
  });

  const lineRows = items.map((ln) => {
    const isIncluded = (Number(ln.price) || 0) === 0;
    return new TableRow({
      children: [
        cell(ln.desc || '', COLS[0]),
        cell(isIncluded ? 'כלול' : ils(Number(ln.price) || 0), COLS[1], { align: AlignmentType.CENTER, fill: isIncluded ? 'F0F7F0' : undefined }),
      ],
    });
  });

  const table = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: COLS,
    visuallyRightToLeft: true,
    rows: [headerRow, ...lineRows],
  });

  const children: (Paragraph | Table)[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 60 }, children: [new TextRun({ text: 'טיוטת הצעת מחיר', bold: true, font: 'Arial', size: 36 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 240 }, children: [new TextRun({ text: 'לאלס — להעתקה לפנקס ההצעות שלך (לוגו, ח.פ., כתובת) ושליחה ישירה ללקוח', italics: true, font: 'Arial', size: 18, color: '888888' })] }),
    pRtl('תאריך: ' + new Date().toLocaleDateString('he-IL')),
  ];
  if (offer.supplier_name) children.push(pRtl('ספק: ' + offer.supplier_name));
  if (offer.project_ref) children.push(pRtl('עבור: ' + offer.project_ref, { bold: true }));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  children.push(table);
  children.push(pRtl('סה"כ לתשלום: ' + ils(offer.total_ils), { bold: true, size: 28 }));
  children.push(pRtl('המחיר כולל מע"מ.', { size: 20, after: 240 }));
  children.push(pRtl('הערה: זוהי טיוטה בלבד להעתקה לנייר המכתבים של הספק. אבשי / Marble Art הוא גורם שיווקי בלבד; ההתקשרות, ההזמנה, החשבונית והתשלום מתבצעים ישירות מול הספק.', { size: 16, color: '999999' }));

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  let body: Uint8Array;
  try {
    const zip = await JSZip.loadAsync(buffer);
    const f = zip.file('word/document.xml');
    if (f) {
      let xml = await f.async('string');
      // GLOBAL: flip every section to RTL (handover cause (b): only one section was getting bidi before)
      xml = xml.replace(/<w:sectPr([^>]*)>/g, (m, attrs) => m.includes('<w:bidi') ? m : '<w:sectPr' + attrs + '><w:bidi/>');
      zip.file('word/document.xml', xml);
      body = await zip.generateAsync({ type: 'uint8array' });
    } else { body = new Uint8Array(buffer); }
  } catch { body = new Uint8Array(buffer); }

  const fileName = 'supplier_offer_draft_' + ddmmyyyy() + '.docx';
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="' + fileName + '"',
    },
  });
}
