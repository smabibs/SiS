import ExcelJS from 'exceljs';

interface SchoolInfo {
    school_name: string;
    school_address: string;
    school_npsn: string;
    lab_name: string;
    lab_head: string;
}

export function createWorkbook(title: string, info: SchoolInfo, colCount = 8): { workbook: ExcelJS.Workbook; sheet: ExcelJS.Worksheet } {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SiLabIPA';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title);

    // ── A4 Page Setup ──────────────────────────────────────────────────
    sheet.pageSetup = {
        paperSize: 9,            // A4
        orientation: 'landscape', // landscape for wider tables
        fitToPage: true,
        fitToWidth: 1,           // scale to fit 1 page wide
        fitToHeight: 0,          // unlimited height (multi-page OK)
        horizontalCentered: true,
        margins: {
            left: 0.4, right: 0.4,
            top: 0.5, bottom: 0.5,
            header: 0.3, footer: 0.3,
        },
    };
    // Print row headers on every page
    sheet.headerFooter = {
        oddFooter: '&C&P / &N',  // Page X of Y
    };

    const lastCol = String.fromCharCode(64 + colCount); // A=1, H=8, etc.

    // Header row 1: School name
    sheet.mergeCells(`A1:${lastCol}1`);
    const headerCell = sheet.getCell('A1');
    headerCell.value = info.school_name || 'Sekolah';
    headerCell.font = { bold: true, size: 13 };
    headerCell.alignment = { horizontal: 'center' };

    // Header row 2: address
    sheet.mergeCells(`A2:${lastCol}2`);
    const addrCell = sheet.getCell('A2');
    addrCell.value = info.school_address || '';
    addrCell.font = { size: 9 };
    addrCell.alignment = { horizontal: 'center' };

    // Header row 3: lab name
    sheet.mergeCells(`A3:${lastCol}3`);
    const labCell = sheet.getCell('A3');
    labCell.value = info.lab_name || 'Laboratorium IPA';
    labCell.font = { bold: true, size: 10 };
    labCell.alignment = { horizontal: 'center' };

    // Separator
    sheet.mergeCells(`A4:${lastCol}4`);
    sheet.getRow(4).height = 4;

    // Title row
    sheet.mergeCells(`A5:${lastCol}5`);
    const titleCell = sheet.getCell('A5');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 11 };
    titleCell.alignment = { horizontal: 'center' };

    // Empty row
    sheet.addRow([]);

    return { workbook, sheet };
}

export function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number) {
    const row = sheet.getRow(rowNumber);
    row.eachCell((cell: ExcelJS.Cell) => {
        cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0D9488' }, // Teal
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, shrinkToFit: false };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });
    row.height = 28;
}

export function styleDataRows(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
    for (let i = startRow; i <= endRow; i++) {
        const row = sheet.getRow(i);
        row.eachCell((cell: ExcelJS.Cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.font = { size: 9 };
        });
        // alternating stripe
        if (i % 2 === 0) {
            row.eachCell((cell: ExcelJS.Cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF0FDFA' },
                };
            });
        }
    }
}

export function addSignatureBlock(sheet: ExcelJS.Worksheet, startRow: number, info: SchoolInfo) {
    const row = startRow + 2;

    // Date
    const now = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    sheet.mergeCells(`F${row}:H${row}`);
    sheet.getCell(`F${row}`).value = dateStr;
    sheet.getCell(`F${row}`).alignment = { horizontal: 'center' };

    // Labels
    sheet.mergeCells(`A${row + 1}:C${row + 1}`);
    sheet.getCell(`A${row + 1}`).value = 'Mengetahui,';
    sheet.getCell(`A${row + 1}`).alignment = { horizontal: 'center' };

    sheet.mergeCells(`F${row + 1}:H${row + 1}`);
    sheet.getCell(`F${row + 1}`).value = 'Pengelola Laboratorium,';
    sheet.getCell(`F${row + 1}`).alignment = { horizontal: 'center' };

    // Signature space
    sheet.mergeCells(`A${row + 5}:C${row + 5}`);
    sheet.getCell(`A${row + 5}`).value = 'Kepala Sekolah';
    sheet.getCell(`A${row + 5}`).alignment = { horizontal: 'center' };
    sheet.getCell(`A${row + 5}`).font = { bold: true, underline: true, size: 10 };

    sheet.mergeCells(`F${row + 5}:H${row + 5}`);
    sheet.getCell(`F${row + 5}`).value = info.lab_head || 'Kepala Lab';
    sheet.getCell(`F${row + 5}`).alignment = { horizontal: 'center' };
    sheet.getCell(`F${row + 5}`).font = { bold: true, underline: true, size: 10 };
}

// A4 landscape usable width ≈ 135 Excel units (after margins)
const A4_LANDSCAPE_WIDTH = 135;

export function autoColumnWidth(sheet: ExcelJS.Worksheet) {
    // Phase 1: measure natural widths
    const naturalWidths: number[] = [];
    sheet.columns.forEach((column: Partial<ExcelJS.Column>, idx: number) => {
        if (!column || !column.eachCell) { naturalWidths[idx] = 8; return; }
        let maxLength = 6;
        column.eachCell!({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
            const cellValue = cell.value ? String(cell.value) : '';
            const len = cellValue.length;
            if (len > maxLength) maxLength = len;
        });
        naturalWidths[idx] = Math.min(maxLength + 2, 30);
    });

    // Phase 2: scale down proportionally if total exceeds A4 width
    const totalNatural = naturalWidths.reduce((a, b) => a + b, 0);
    const scale = totalNatural > A4_LANDSCAPE_WIDTH ? A4_LANDSCAPE_WIDTH / totalNatural : 1;

    sheet.columns.forEach((column: Partial<ExcelJS.Column>, idx: number) => {
        if (!column) return;
        column.width = Math.max(4, Math.round(naturalWidths[idx] * scale));
    });
}
