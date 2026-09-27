import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  FileCode,
  Music,
  Image as ImageIcon,
  File,
  Eye,
  Maximize2,
  Minimize2,
  RefreshCw,
  Table as TableIcon,
  Code2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Layers,
  Scroll,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Search,
  Filter,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { SearchableSelect, SearchableOption } from './SearchableSelect';

export interface PreviewableFile {
  filename: string;
  category?: string;
  category_name?: string;
  url: string;
  file_type?: string;
  size_formatted?: string;
  created_at?: string;
  is_trash?: boolean;
  content?: string;
  raw_content?: string;
}

interface FilePreviewModalProps {
  file: PreviewableFile | null;
  onClose: () => void;
  extraActions?: React.ReactNode;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, extraActions }) => {
  // 1. Core State Hooks
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [csvViewMode, setCsvViewMode] = useState<'table' | 'raw'>('table');

  // 2. Multi-Page Extracted Vector State (Supports 31, 50, 100+ pages)
  const [extractedMeta, setExtractedMeta] = useState<{
    page_count?: number;
    chunk_count?: number;
    char_count?: number;
  } | null>(null);
  const [selectedExtractedPage, setSelectedExtractedPage] = useState<number | 'all'>('all');
  const [extractedSearchQuery, setExtractedSearchQuery] = useState<string>('');

  // 3. PDF Page Viewer State
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [pdfViewMode, setPdfViewMode] = useState<'scroll' | 'single' | 'text'>('scroll');
  const [pdfImageErrors, setPdfImageErrors] = useState<Record<number, boolean>>({});

  // 4. File Type Classifications
  const ext = (file?.file_type || file?.filename?.split('.').pop() || '').toUpperCase();
  const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG', 'ICO', 'BMP'].includes(ext);
  const isAudio = ['MP3', 'WAV', 'OGG', 'M4A', 'AAC', 'FLAC'].includes(ext);
  const isPdf = ['PDF'].includes(ext);
  const isDocx = ['DOCX', 'DOC', 'RTF', 'ODT'].includes(ext);
  const isCsv = ['CSV'].includes(ext);
  const isTextOrCode = [
    'TXT',
    'JSON',
    'CSV',
    'MD',
    'YAML',
    'YML',
    'XML',
    'HTML',
    'JS',
    'TS',
    'TSX',
    'PY',
    'LOG',
    'ENV',
    'SH',
    'SQL',
    'DOCX',
    'DOC',
    'RTF',
  ].includes(ext) || Boolean(file?.content || file?.raw_content);

  // 5. Load PDF metadata Effect
  useEffect(() => {
    if (!file || !isPdf || !file.filename) return;

    setPdfPage(1);
    setPdfZoom(100);
    setPdfImageErrors({});
    setIsPdfLoading(true);

    const trashMatch = file.url ? file.url.match(/trash\/(?:download\/)?([a-f0-9-]+)/i) : null;
    const trashId = trashMatch ? trashMatch[1] : null;

    const infoUrl = trashId
      ? `/api/uploads/trash/pdf-info/${trashId}`
      : `/api/uploads/pdf-info/${file.category || 'knowledge_base'}/${encodeURIComponent(file.filename)}`;

    fetch(infoUrl)
      .then((res) => {
        if (!res.ok) throw new Error('PDF info endpoint unavailable');
        return res.json();
      })
      .then((data) => {
        if (data.total_pages) {
          setPdfTotalPages(data.total_pages);
        }
        setIsPdfLoading(false);
      })
      .catch((err) => {
        console.warn('PDF info notice:', err);
        setIsPdfLoading(false);
      });
  }, [file, isPdf]);

  // 6. Load Full Multi-Page Extracted Vector Text Effect (Handles 31, 50, 100+ pages)
  useEffect(() => {
    if (!file) {
      setTextContent(null);
      setTextError(null);
      setExtractedMeta(null);
      setSelectedExtractedPage('all');
      setExtractedSearchQuery('');
      return;
    }

    setIsLoadingText(true);
    setTextError(null);
    setSelectedExtractedPage('all');
    setExtractedSearchQuery('');

    // Try fetching complete multi-page extracted text from backend cache/worker
    const fetchFullExtracted = async () => {
      if (file.filename) {
        try {
          const cat = file.category || 'knowledge_base';
          const endpoints = [
            `/api/knowledge-base/documents/${encodeURIComponent(file.filename)}/extracted-text`,
            `/api/uploads/extracted/${cat}/${encodeURIComponent(file.filename)}`,
          ];

          for (const ep of endpoints) {
            try {
              const res = await fetch(ep);
              if (res.ok) {
                const data = await res.json();
                if (data.text) {
                  setTextContent(data.text);
                  setExtractedMeta({
                    page_count: data.page_count,
                    chunk_count: data.chunk_count,
                    char_count: data.char_count || data.text.length,
                  });
                  if (data.page_count && data.page_count > 1) {
                    setPdfTotalPages(data.page_count);
                  }
                  setIsLoadingText(false);
                  return;
                }
              }
            } catch {}
          }
        } catch (err) {
          console.warn('Extracted text fetch warning:', err);
        }
      }

      // Fallback: If pre-passed content is comprehensive
      if (file.content || file.raw_content) {
        const fallbackText = file.content || file.raw_content || '';
        setTextContent(fallbackText);
        setIsLoadingText(false);
        return;
      }

      // Fallback: Direct file stream read
      if (file.url && (isTextOrCode || isPdf)) {
        fetch(file.url)
          .then((res) => {
            if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
            return res.text();
          })
          .then((text) => {
            setTextContent(text);
            setIsLoadingText(false);
          })
          .catch((err) => {
            setTextError(err.message || 'Could not load text content');
            setIsLoadingText(false);
          });
      } else {
        setTextContent(null);
        setIsLoadingText(false);
      }
    };

    fetchFullExtracted();
  }, [file, isTextOrCode, isPdf]);

  // 7. Memoized Active Text & Multi-Page Parsing (MUST be called BEFORE any early returns!)
  const activeTextToRender = textContent || file?.content || file?.raw_content || '';

  const parsedExtractedPages = useMemo(() => {
    if (!activeTextToRender) return [];

    const pageMarkerRegex = /(?:^|\n)##\s*Page\s*(\d+)/gi;
    const matches = Array.from(activeTextToRender.matchAll(pageMarkerRegex)) as RegExpExecArray[];

    if (matches.length > 1) {
      const pages: { pageNum: number; content: string }[] = [];
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const pageNum = parseInt(match[1], 10) || i + 1;
        const startIndex = match.index ?? 0;
        const nextIndex = i + 1 < matches.length ? (matches[i + 1].index ?? activeTextToRender.length) : activeTextToRender.length;
        const pageRaw = activeTextToRender.substring(startIndex, nextIndex).trim();
        pages.push({ pageNum, content: pageRaw });
      }
      return pages;
    }

    return [{ pageNum: 1, content: activeTextToRender }];
  }, [activeTextToRender]);

  const displayedExtractedPages = useMemo(() => {
    let list = parsedExtractedPages;
    if (selectedExtractedPage !== 'all') {
      list = list.filter((p) => p.pageNum === selectedExtractedPage);
    }
    if (extractedSearchQuery.trim()) {
      const q = extractedSearchQuery.toLowerCase().trim();
      list = list.filter((p) => p.content.toLowerCase().includes(q));
    }
    return list;
  }, [parsedExtractedPages, selectedExtractedPage, extractedSearchQuery]);

  const parsedCsvRows = useMemo(() => {
    if (!isCsv || !activeTextToRender) return [];
    try {
      const lines = activeTextToRender.trim().split('\n');
      return lines.map((line) => {
        const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
        const matches = line.match(regex);
        return matches ? matches.map((m) => m.replace(/^"|"$/g, '').trim()) : line.split(',');
      });
    } catch {
      return [];
    }
  }, [isCsv, activeTextToRender]);

  const totalPageCount = parsedExtractedPages.length > 1 ? parsedExtractedPages.length : (extractedMeta?.page_count || pdfTotalPages || 1);
  const totalChunksCount = extractedMeta?.chunk_count || (activeTextToRender ? Math.max(1, Math.ceil(activeTextToRender.length / 700)) : 1);

  const pageOptions: SearchableOption[] = useMemo(() => {
    const opts: SearchableOption[] = [
      { value: 'all', label: `All Pages (${totalPageCount})`, badge: `${totalPageCount} Pgs`, badgeVariant: 'primary' },
    ];
    parsedExtractedPages.forEach((p) => {
      opts.push({
        value: String(p.pageNum),
        label: `Page ${p.pageNum}`,
        subLabel: `${p.content.length.toLocaleString()} chars • ${p.content.split('\n').length} lines`,
        badge: `Pg ${p.pageNum}`,
        badgeVariant: 'secondary',
      });
    });
    return opts;
  }, [parsedExtractedPages, totalPageCount]);

  // ALL HOOKS DEFINED ABOVE. EARLY RETURN PLACED HERE SAFELY:
  if (!file) return null;

  const csvHeaders = parsedCsvRows.length > 0 ? parsedCsvRows[0] : [];
  const csvBody = parsedCsvRows.length > 1 ? parsedCsvRows.slice(1) : [];

  const rawUrl = file.url || `/api/uploads/${file.category || 'knowledge_base'}/${encodeURIComponent(file.filename || 'file')}`;
  const downloadUrl = rawUrl.includes('?') ? `${rawUrl}&download=true` : `${rawUrl}?download=true`;

  const trashMatch = file.url ? file.url.match(/trash\/(?:download\/)?([a-f0-9-]+)/i) : null;
  const trashId = trashMatch ? trashMatch[1] : null;

  const getPdfPageUrl = (p: number) => {
    return trashId
      ? `/api/uploads/trash/pdf-page/${trashId}?page=${p}&dpi=150`
      : `/api/uploads/pdf-page/${file.category || 'knowledge_base'}/${encodeURIComponent(file.filename)}?page=${p}&dpi=150`;
  };

  const handleCopyText = (customText?: any) => {
    const textToCopy = (typeof customText === 'string' ? customText : null) || textContent || file.content || file.raw_content || '';
    if (!textToCopy) return;
    try {
      navigator.clipboard.writeText(String(textToCopy));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
  };

  // Safe Open in New Tab Viewer (Zero Download)
  const handleOpenInNewTab = () => {
    if (!file) return;

    if (isPdf) {
      const newWindow = window.open('', '_blank');
      if (!newWindow) return;

      const origin = window.location.origin;
      const pagesHtml = Array.from({ length: pdfTotalPages }, (_, i) => i + 1)
        .map(
          (p) => `
          <div style="margin: 24px auto; max-width: 920px; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); overflow: hidden; position: relative; border: 1px solid #e2e8f0;">
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(15, 23, 42, 0.75); color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; backdrop-filter: blur(4px);">
              Page ${p} of ${pdfTotalPages}
            </div>
            <img src="${origin}${getPdfPageUrl(p)}" style="width: 100%; display: block;" loading="lazy" alt="Page ${p}" />
          </div>`
        )
        .join('');

      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${file.filename} - Live Document Viewer</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 20px; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; }
            .header-bar { position: sticky; top: 0; z-index: 1000; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); padding: 14px 24px; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.3); margin-bottom: 20px; }
            .doc-title { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; }
            .doc-sub { margin: 3px 0 0; font-size: 12px; color: #94a3b8; }
            .dl-btn { background: #2563eb; color: #ffffff; text-decoration: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s; }
            .dl-btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 class="doc-title">${file.filename}</h1>
              <p class="doc-sub">${pdfTotalPages} Total Pages • Live Continuous Document Stream</p>
            </div>
            <a href="${origin}${downloadUrl}" class="dl-btn" download="${file.filename}">
              Download Document Copy
            </a>
          </div>
          <div style="padding-bottom: 40px;">
            ${pagesHtml}
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    } else if (isImage) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${file.filename} - Image Viewer</title>
            <style>
              body { margin: 0; background: #09090b; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 95vw; max-height: 95vh; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 8px; }
            </style>
          </head>
          <body>
            <img src="${file.url}" alt="${file.filename}" />
          </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      window.open(file.url, '_blank');
    }
  };

  // Render High-Fidelity Multi-Page Vector Content Sheet
  const renderDocumentSheet = () => {
    return (
      <div className="w-full max-w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 space-y-5 text-zinc-900 dark:text-zinc-100">
        {/* Document Header Branding & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              {ext === 'PDF' ? <FileText className="h-5 w-5 text-rose-500" /> : <BookOpen className="h-5 w-5 text-blue-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate max-w-sm sm:max-w-md" title={file.filename}>
                  {file.filename}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                  {ext}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{file.category_name || file.category || 'Knowledge Base'}</span>
                <span>•</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{totalPageCount} Pages Extracted</span>
                <span>•</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalChunksCount} Vector Chunks</span>
                <span>•</span>
                <span className="font-mono">{activeTextToRender.length.toLocaleString()} chars</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" className="font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              100% Vector Grounded
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyText()}
              leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              className="text-xs font-semibold h-8"
            >
              {copied ? 'Copied All' : 'Copy All Text'}
            </Button>
          </div>
        </div>

        {/* Multi-Page Navigation Bar & Live Search (Perfect for 31, 50, 100+ pages) */}
        {activeTextToRender && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/70 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search inside extracted vector pages..."
                  value={extractedSearchQuery}
                  onChange={(e) => setExtractedSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                {extractedSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setExtractedSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {parsedExtractedPages.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    <span>Page:</span>
                  </span>
                  <div className="w-48">
                    <SearchableSelect
                      value={String(selectedExtractedPage)}
                      onChange={(v) => setSelectedExtractedPage(v === 'all' ? 'all' : parseInt(v, 10))}
                      options={pageOptions}
                      placeholder="Select Page..."
                      searchPlaceholder="Filter pages..."
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 self-end sm:self-center">
              <span>Showing <strong>{displayedExtractedPages.length}</strong> of <strong>{totalPageCount}</strong> pages</span>
            </div>
          </div>
        )}

        {/* Multi-Page Rendered Body */}
        {isLoadingText ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">Extracting complete multi-page vector text...</p>
          </div>
        ) : displayedExtractedPages.length > 0 ? (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
            {displayedExtractedPages.map((pageItem) => (
              <div
                key={`extracted-page-card-${pageItem.pageNum}`}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 overflow-hidden shadow-2xs"
              >
                {/* Page Card Subheader */}
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs">
                      <FileText className="h-3 w-3" />
                      Page {pageItem.pageNum} / {totalPageCount}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {pageItem.content.length} chars • {pageItem.content.split('\n').length} lines
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(pageItem.content)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    title={`Copy Page ${pageItem.pageNum} text`}
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy Page</span>
                  </button>
                </div>

                {/* Page Markdown Content */}
                <div className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950">
                  {pageItem.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-400 space-y-2">
            <FileText className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-semibold">No matching pages found</p>
            <p className="text-xs max-w-sm mx-auto">
              No extracted vector content matched your filter query "{extractedSearchQuery}".
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setExtractedSearchQuery('');
                setSelectedExtractedPage('all');
              }}
              className="mt-2 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-all duration-300 ${
          isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-5xl h-[90vh] max-h-[92vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={file.filename}>
                  {file.filename}
                </h3>
                {file.category && (
                  <Badge variant="outline" className="text-[10px] hidden md:inline-flex">
                    uploads/{file.category}/
                  </Badge>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {ext || 'FILE'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                {file.size_formatted ? `${file.size_formatted} • ` : ''}
                Live Document & Asset Preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {extraActions}

            {isCsv && activeTextToRender && (
              <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setCsvViewMode('table')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    csvViewMode === 'table'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <TableIcon className="h-3 w-3" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCsvViewMode('raw')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    csvViewMode === 'raw'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="h-3 w-3" />
                  <span>Raw</span>
                </button>
              </div>
            )}

            {isTextOrCode && activeTextToRender && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="h-8 text-xs px-2.5 hidden sm:inline-flex"
                leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}

            {/* Safe In-App Open in New Tab Button */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Open Live Viewer in New Tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>

            {/* Explicit Download Button */}
            <a
              href={downloadUrl}
              download={file.filename}
              className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Download file copy"
            >
              <Download className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:inline-flex cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Reader Toolbar with View Mode Toggle */}
        {isPdf && (
          <div className="px-4 py-2 bg-zinc-100/90 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setPdfViewMode('scroll')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pdfViewMode === 'scroll'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Scroll className="h-3 w-3" />
                <span>Continuous Pages ({pdfTotalPages})</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfViewMode('single')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pdfViewMode === 'single'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Page Flip</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfViewMode('text')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pdfViewMode === 'text'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <BookOpen className="h-3 w-3" />
                <span>Extracted Vector Content</span>
              </button>
            </div>

            {pdfViewMode === 'single' && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  disabled={pdfPage <= 1}
                  className="p-1 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                  Page <span className="text-blue-600 dark:text-blue-400 font-bold">{pdfPage}</span> of {pdfTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPdfPage((p) => Math.min(pdfTotalPages, p + 1))}
                  disabled={pdfPage >= pdfTotalPages}
                  className="p-1 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            {pdfViewMode !== 'text' && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setPdfZoom((z) => Math.max(30, z - 10))}
                  disabled={pdfZoom <= 30}
                  className="p-1 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Zoom Out (-10%)"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPdfZoom(100)}
                  className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title="Click to reset zoom to 100%"
                >
                  {pdfZoom}%
                </button>
                <button
                  type="button"
                  onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
                  disabled={pdfZoom >= 200}
                  className="p-1 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Zoom In (+10%)"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-auto p-2.5 sm:p-4 bg-zinc-100/60 dark:bg-zinc-950 flex flex-col items-center justify-start">
          {/* PDF Page Interactive Viewer */}
          {isPdf && (
            <div className="w-full flex-1 flex flex-col items-center justify-start">
              {isPdfLoading ? (
                <div className="py-24 text-center my-auto">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Loading document pages...</p>
                </div>
              ) : pdfViewMode === 'text' ? (
                renderDocumentSheet()
              ) : pdfViewMode === 'scroll' ? (
                /* Continuous Scroll Mode */
                <div
                  className="flex flex-col items-center gap-5 w-full py-1"
                  style={{
                    width: `${pdfZoom}%`,
                    maxWidth: '100%',
                  }}
                >
                  {Array.from({ length: pdfTotalPages }, (_, i) => i + 1).map((pageNum) => (
                    <div
                      key={`pdf-scroll-page-${pageNum}`}
                      className="relative w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                    >
                      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-zinc-900/80 text-white text-[10px] font-bold backdrop-blur shadow-xs">
                        Page {pageNum} / {pdfTotalPages}
                      </div>
                      {pdfImageErrors[pageNum] ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-zinc-50 dark:bg-zinc-900/60 rounded-xl m-4 border border-zinc-200 dark:border-zinc-800">
                          <FileText className="h-10 w-10 text-zinc-400 mb-2" />
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Page {pageNum} Visual Stream</p>
                          <p className="text-[11px] text-zinc-400 max-w-xs mt-1">Switch to "Extracted Vector Content" tab to view complete searchable text.</p>
                          <button
                            type="button"
                            onClick={() => setPdfViewMode('text')}
                            className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                          >
                            View Extracted Content
                          </button>
                        </div>
                      ) : (
                        <img
                          src={getPdfPageUrl(pageNum)}
                          alt={`Page ${pageNum} of ${file.filename}`}
                          className="w-full h-auto object-contain select-none min-h-[300px]"
                          loading={pageNum <= 3 ? 'eager' : 'lazy'}
                          onError={() => {
                            setPdfImageErrors((prev) => ({ ...prev, [pageNum]: true }));
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Single Page Flip Mode */
                <div
                  className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800 transition-all duration-150 overflow-hidden my-auto w-full"
                  style={{
                    width: `${pdfZoom}%`,
                    maxWidth: '100%',
                  }}
                >
                  {pdfImageErrors[pdfPage] ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-50 dark:bg-zinc-900/60 rounded-xl m-4 border border-zinc-200 dark:border-zinc-800">
                      <FileText className="h-12 w-12 text-zinc-400 mb-2" />
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Page {pdfPage} Preview</p>
                      <p className="text-xs text-zinc-400 max-w-sm mt-1">Direct PDF page render unavailable. Switch to the full extracted vector content tab to read all pages.</p>
                      <button
                        type="button"
                        onClick={() => setPdfViewMode('text')}
                        className="mt-4 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                      >
                        Read Extracted Vector Content
                      </button>
                    </div>
                  ) : (
                    <img
                      key={`pdf-single-${file.filename}-${pdfPage}`}
                      src={getPdfPageUrl(pdfPage)}
                      alt={`Page ${pdfPage} of ${file.filename}`}
                      className="w-full h-auto object-contain select-none min-h-[300px]"
                      loading="eager"
                      onError={() => {
                        setPdfImageErrors((prev) => ({ ...prev, [pdfPage]: true }));
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image Viewer */}
          {isImage && (
            <div className="flex flex-col items-center justify-center w-full h-full my-auto">
              <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md max-w-full max-h-full overflow-hidden flex items-center justify-center">
                <img src={file.url} alt={file.filename} className="max-h-[70vh] max-w-full object-contain rounded-lg" />
              </div>
              <p className="text-xs text-zinc-400 mt-2 font-mono">{file.filename}</p>
            </div>
          )}

          {/* Audio Player */}
          {isAudio && (
            <div className="w-full max-w-xl p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg text-center space-y-4 my-auto">
              <div className="h-16 w-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                <Music className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{file.filename}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Audio Recording & Prompt Player</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <audio controls src={file.url} className="w-full" autoPlay>
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}

          {/* Text / Code / CSV / DOCX Viewer */}
          {!isPdf && isTextOrCode && (
            <div className="w-full h-full flex flex-col overflow-hidden">
              {isLoadingText ? (
                <div className="py-20 text-center my-auto">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Reading document contents...</p>
                </div>
              ) : isCsv && csvViewMode === 'table' && parsedCsvRows.length > 0 ? (
                /* CSV Table Viewer */
                <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs flex flex-col">
                  <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 shrink-0">
                    <span>
                      Showing {csvBody.length} rows & {csvHeaders.length} columns
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Structured CSV Data
                    </Badge>
                  </div>
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/80 sticky top-0 border-b border-zinc-200 dark:border-zinc-700">
                        <tr>
                          <th className="py-2 px-3 text-[10px] font-bold text-zinc-400 w-10">#</th>
                          {csvHeaders.map((header, idx) => (
                            <th key={idx} className="py-2 px-3 font-bold text-zinc-700 dark:text-zinc-300">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {csvBody.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                            <td className="py-2 px-3 text-[10px] font-mono text-zinc-400">{rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] truncate max-w-xs">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : isDocx || ext === 'MD' ? (
                /* Formatted Document / Markdown Viewer */
                <div className="w-full h-full overflow-y-auto flex justify-center py-2">
                  {renderDocumentSheet()}
                </div>
              ) : (
                /* Raw Code / Text Viewer */
                <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs flex flex-col">
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 shrink-0">
                    <span className="font-mono text-[11px]">
                      {activeTextToRender ? `${activeTextToRender.split('\n').length} lines • ${activeTextToRender.length} chars` : ''}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">{ext} Document</span>
                  </div>
                  <pre className="p-4 overflow-auto font-mono text-xs text-zinc-800 dark:text-zinc-200 flex-1 whitespace-pre leading-relaxed select-text">
                    {activeTextToRender}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Generic Other Binary Files */}
          {!isPdf && !isImage && !isAudio && !isTextOrCode && (
            <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-lg my-auto">
              <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mx-auto">
                <File className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{file.filename}</h4>
                <p className="text-xs text-zinc-400 mt-1">Binary file format ({ext})</p>
                <p className="text-xs text-zinc-500 mt-2">
                  Direct browser rendering is not supported for this file type. You can download or open it in your system viewer.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <a href={downloadUrl} download={file.filename}>
                  <Button variant="primary" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                    Download File ({file.size_formatted || 'File'})
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
