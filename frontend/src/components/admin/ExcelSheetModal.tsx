import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Search, 
  X, 
  Maximize2, 
  Minimize2, 
  Check, 
  Filter,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExcelSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filename?: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
  sheetName?: string;
}

// Convert 0 -> 'A', 1 -> 'B', 25 -> 'Z', 26 -> 'AA', etc.
const getColumnLetter = (index: number): string => {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

export const ExcelSheetModal: React.FC<ExcelSheetModalProps> = ({
  isOpen,
  onClose,
  title,
  filename = 'Export.xlsx',
  columns,
  data,
  sheetName = 'Sheet1'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: any } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol] ?? '';
        const valB = b[sortCol] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, searchTerm, sortCol, sortDir]);

  if (!isOpen) return null;

  // Export to Real .xlsx file
  const handleDownloadExcel = () => {
    try {
      // Build headers and row array
      const headers = columns.map((col) => col.header);
      const rows = filteredData.map((row) =>
        columns.map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return '';
          if (Array.isArray(val)) return val.join(', ');
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return val;
        })
      );

      const worksheetData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Auto-fit column widths
      const colWidths = columns.map((col, idx) => {
        let maxLen = col.header.length;
        rows.forEach((r) => {
          const cellLen = String(r[idx] ?? '').length;
          if (cellLen > maxLen) maxLen = Math.min(cellLen, 50);
        });
        return { wch: Math.max(maxLen + 3, 12) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      XLSX.writeFile(wb, cleanFilename);
    } catch (err) {
      console.error('Failed to export Excel file:', err);
      alert('Could not export Excel file. Please try downloading CSV instead.');
    }
  };

  // Export to CSV
  const handleDownloadCsv = () => {
    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = filteredData.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          const str = val === null || val === undefined ? '' : Array.isArray(val) ? val.join(', ') : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanFilename = filename.replace(/\.xlsx$/i, '') + '.csv';
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy table to clipboard in tab-delimited format (ready to paste directly into Excel / Google Sheets)
  const handleCopyToClipboard = () => {
    const headers = columns.map((c) => c.header).join('\t');
    const rows = filteredData.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return '';
          if (Array.isArray(val)) return val.join(', ');
          return String(val).replace(/[\t\n\r]+/g, ' ');
        })
        .join('\t')
    );

    const text = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleHeaderClick = (colKey: string) => {
    if (sortCol === colKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col transition-all duration-200 overflow-hidden ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-[96vw] max-w-7xl h-[88vh]'
        }`}
      >
        {/* Excel Title Bar (Authentic Excel Green Theme) */}
        <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-[#107c41]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                {filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`}
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-white/20 text-white/95">
                  Excel View Mode
                </span>
              </span>
              <p className="text-[11px] text-white/80 leading-none">{title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/20 rounded-md text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-rose-600 rounded-md text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Excel Ribbon / Action Toolbar */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#107c41] hover:bg-[#0e6b37] text-white shadow-xs transition-all"
              title="Download as Microsoft Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              Download .XLSX
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-all"
              title="Download as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              CSV
            </button>

            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-all"
              title="Copy table to paste directly into Excel"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Table'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search cell values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#107c41] w-48 sm:w-64"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Rows: <span className="font-bold text-slate-700">{filteredData.length}</span> | Cols:{' '}
              <span className="font-bold text-slate-700">{columns.length}</span>
            </div>
          </div>
        </div>

        {/* Excel Formula Bar */}
        <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 flex-shrink-0 text-xs font-mono">
          <div className="w-14 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-center text-slate-700 font-bold">
            {selectedCell ? `${getColumnLetter(selectedCell.col)}${selectedCell.row + 1}` : 'A1'}
          </div>
          <span className="text-slate-400 font-serif italic text-sm">fx</span>
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-0.5 text-slate-800 truncate">
            {selectedCell ? String(selectedCell.val ?? '') : (filteredData[0] ? String(filteredData[0][columns[0]?.key] ?? '') : '')}
          </div>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="flex-1 overflow-auto bg-white select-text">
          <table className="w-full border-collapse text-xs font-sans">
            {/* Table Header */}
            <thead className="bg-[#f3f4f6] text-slate-700 sticky top-0 z-20 border-b border-slate-300 shadow-xs">
              <tr>
                {/* Top-left corner cell */}
                <th className="w-12 min-w-[48px] p-2 text-center font-bold text-[11px] text-slate-500 bg-slate-200 border-r border-b border-slate-300 sticky left-0 z-30 select-none">
                  #
                </th>
                {columns.map((col, idx) => (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col.key)}
                    className="p-2.5 text-left font-bold border-r border-b border-slate-300 cursor-pointer hover:bg-slate-300 transition-colors whitespace-nowrap min-w-[130px] select-none"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono mr-1">
                        {getColumnLetter(idx)}
                      </span>
                      <span className="font-semibold text-slate-900 truncate flex-1">{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-16 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No data found in worksheet</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing the search filter</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, rowIdx) => {
                  const rowNumber = rowIdx + 1;
                  return (
                    <tr
                      key={rowIdx}
                      className="hover:bg-emerald-50/40 border-b border-slate-200 transition-colors"
                    >
                      {/* Row number header */}
                      <td className="w-12 min-w-[48px] p-2 text-center text-[11px] font-mono text-slate-500 bg-slate-100 border-r border-slate-200 sticky left-0 z-10 select-none">
                        {rowNumber}
                      </td>

                      {/* Row cell values */}
                      {columns.map((col, colIdx) => {
                        const rawVal = row[col.key];
                        let displayVal = rawVal;
                        if (rawVal === null || rawVal === undefined) {
                          displayVal = '';
                        } else if (Array.isArray(rawVal)) {
                          displayVal = rawVal.join(', ');
                        } else if (typeof rawVal === 'boolean') {
                          displayVal = rawVal ? 'Yes' : 'No';
                        }

                        const isCellSelected =
                          selectedCell?.row === rowIdx && selectedCell?.col === colIdx;

                        return (
                          <td
                            key={col.key}
                            onClick={() =>
                              setSelectedCell({ row: rowIdx, col: colIdx, val: displayVal })
                            }
                            className={`p-2.5 border-r border-slate-200 text-slate-800 truncate max-w-xs cursor-cell transition-all ${
                              isCellSelected
                                ? 'outline-2 outline-[#107c41] bg-emerald-50/70 font-semibold'
                                : 'hover:bg-slate-50'
                            }`}
                            title={String(displayVal)}
                          >
                            {/* Special visual badge for Status column */}
                            {col.key === 'status' || col.key === 'application_status' ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  String(displayVal).toLowerCase().includes('approved')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : String(displayVal).toLowerCase().includes('reject')
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {displayVal || 'Pending review'}
                              </span>
                            ) : (
                              String(displayVal)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Excel Bottom Sheet Tab Bar */}
        <div className="bg-slate-100 border-t border-slate-300 px-4 py-2 flex items-center justify-between flex-shrink-0 text-xs text-slate-600 select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-300 rounded-t-md px-3 py-1 text-slate-900 font-bold border-b-2 border-b-[#107c41] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#107c41] mr-1.5" />
              {sheetName}
            </div>
            <span className="text-[11px] text-slate-400 italic">Ready</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-mono">
              Displaying {filteredData.length} of {data.length} records
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelSheetModal;

