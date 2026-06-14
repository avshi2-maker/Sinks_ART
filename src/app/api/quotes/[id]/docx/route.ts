// src/app/api/quotes/[id]/docx/route.ts
// Word (.docx) DRAFT of a quote for Ales — full RTL, final price (VAT included), embedded RFQ images.

import { NextRequest, NextResponse } from 'next/server';
import { fetchQuote } from '@/lib/quotes/fetchQuotes';
import JSZip from 'jszip';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, WidthType, BorderStyle, ShadingType,
} from 'docx';

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }
function fmtDate(iso: string | null): string { return iso ? new Date(iso).toLocaleDateString('he-IL') : '—'; }

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

function pRtl(text: string, opts: { bold?: boolean; size?: number; after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: opts.align || AlignmentType.RIGHT,
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({ text, bold: opts.bold, font: 'Arial', size: opts.size ?? 22 })],
  });
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  } catch { return null; }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await fetchQuote(id);
  if (!quote) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const COLS = [4680, 1200, 1200, 2280];
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell('תיאור', COLS[0], { bold: true, fill: 'E8E8E8' }),
      cell('כמות', COLS[1], { bold: true, fill: 'E8E8E8', align: AlignmentType.CENTER }),
      cell('יחידה', COLS[2], { bold: true, fill: 'E8E8E8', align: AlignmentType.CENTER }),
      cell('מחיר', COLS[3], { bold: true, fill: 'E8E8E8', align: AlignmentType.CENTER }),
    ],
  });

  const lineRows = quote.lines.map((ln) => {
    const isIncluded = (ln.line_total || 0) === 0;
    return new TableRow({
      children: [
        cell(ln.description_he || '', COLS[0]),
        cell(String(ln.quantity ?? ''), COLS[1], { align: AlignmentType.CENTER }),
        cell(ln.unit || '', COLS[2], { align: AlignmentType.CENTER }),
        cell(isIncluded ? 'כלול' : ils(ln.line_total), COLS[3], { align: AlignmentType.CENTER, fill: isIncluded ? 'F0F7F0' : undefined }),
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
    new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 240 }, children: [new TextRun({ text: '(לאלס — להוספת לוגו, נייר מכתבים ועריכה לפני שליחה ללקוח)', italics: true, font: 'Arial', size: 18, color: '888888' })] }),
    pRtl('הצעה מספר: ' + quote.quote_number, { bold: true }),
    pRtl('תאריך: ' + new Date().toLocaleDateString('he-IL')),
  ];
  if (quote.valid_until) children.push(pRtl('בתוקף עד: ' + fmtDate(quote.valid_until)));
  children.push(pRtl('לכבוד', { bold: true, after: 40 }));
  children.push(pRtl(quote.customer_name_he || '—'));
  if (quote.customer_phone) children.push(pRtl('טלפון: ' + quote.customer_phone));
  if (quote.customer_address) children.push(pRtl('כתובת: ' + quote.customer_address));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  children.push(table);
  children.push(pRtl('סה"כ לתשלום: ' + ils(quote.total_grand), { bold: true, size: 28 }));
  children.push(pRtl('המחיר כולל מע"מ.', { size: 20, after: 120 }));
  if (quote.payment_terms_he) children.push(pRtl('תנאי תשלום: ' + quote.payment_terms_he, { size: 20 }));
  if (quote.notes_he) children.push(pRtl('הערות: ' + quote.notes_he, { size: 20 }));

  const rfqImages = quote.rfq_images || [];
  if (rfqImages.length > 0) {
    children.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 300, after: 120 }, children: [new TextRun({ text: 'תמונות הפניה מהלקוח', bold: true, font: 'Arial', size: 24 })] }));
    for (const img of rfqImages) {
      const bytes = await fetchImageBytes(img.url);
      if (!bytes) continue;
      children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 60 }, children: [new ImageRun({ type: 'jpg', data: bytes, transformation: { width: 360, height: 270 } })] }));
      if (img.label) children.push(pRtl(img.label, { size: 18, after: 160 }));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  void quote.created_at;
  const buffer = await Packer.toBuffer(doc);
  let body: Uint8Array;
  try {
    const zip = await JSZip.loadAsync(buffer);
    const f = zip.file('word/document.xml');
    if (f) {
      let xml = await f.async('string');
      if (!xml.includes('<w:bidi/>')) { xml = xml.replace(/(<w:sectPr[^>]*>)/, '$1<w:bidi/>'); }
      zip.file('word/document.xml', xml);
      body = await zip.generateAsync({ type: 'uint8array' });
    } else { body = new Uint8Array(buffer); }
  } catch { body = new Uint8Array(buffer); }
  const fileName = 'quote_' + quote.quote_number + '_DRAFT.docx';
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="' + fileName + '"',
    },
  });
}
