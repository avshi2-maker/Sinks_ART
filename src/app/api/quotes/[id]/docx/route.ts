// src/app/api/quotes/[id]/docx/route.ts
// Generates a Word (.docx) DRAFT of a quote for Ales — he adds logo/letterhead and sends to customer.

import { NextRequest, NextResponse } from 'next/server';
import { fetchQuote } from '@/lib/quotes/fetchQuotes';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
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

function pRtl(text: string, opts: { bold?: boolean; size?: number; after?: number } = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({ text, bold: opts.bold, font: 'Arial', size: opts.size ?? 22 })],
  });
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
    rows: [headerRow, ...lineRows],
  });

  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'טיוטת הצעת מחיר', bold: true, font: 'Arial', size: 36 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: '(לאלס — להוספת לוגו, נייר מכתבים ועריכה לפני שליחה ללקוח)', italics: true, font: 'Arial', size: 18, color: '888888' })] }),
    pRtl('מספר הצעה: ' + quote.quote_number, { bold: true }),
    pRtl('תאריך: ' + fmtDate(quote.created_at)),
    quote.valid_until ? pRtl('בתוקף עד: ' + fmtDate(quote.valid_until)) : pRtl(''),
    pRtl('לכבוד', { bold: true, after: 40 }),
    pRtl(quote.customer_name_he || '—'),
    quote.customer_phone ? pRtl('טלפון: ' + quote.customer_phone) : pRtl(''),
    quote.customer_address ? pRtl('כתובת: ' + quote.customer_address) : pRtl('', { after: 200 }),
    table,
    new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { before: 200, after: 40 }, children: [new TextRun({ text: 'סיכום', bold: true, font: 'Arial', size: 24 })] }),
    pRtl('סכום ביניים: ' + ils(quote.total_subtotal), { after: 40 }),
    pRtl('מע"מ (' + Math.round((quote.vat_rate || 0) * 100) + '%): ' + ils(quote.total_vat), { after: 40 }),
    pRtl('סה"כ כולל מע"מ: ' + ils(quote.total_grand), { bold: true, size: 26 }),
    pRtl('כל המחירים כוללים מע"מ.', { size: 18, after: 40 }),
  ];

  if (quote.payment_terms_he) { children.push(pRtl('תנאי תשלום: ' + quote.payment_terms_he, { size: 20 })); }
  if (quote.notes_he) { children.push(pRtl('הערות: ' + quote.notes_he, { size: 20 })); }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const body = new Uint8Array(buffer);
  const fileName = 'quote_' + quote.quote_number + '_DRAFT.docx';
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="' + fileName + '"',
    },
  });
}
