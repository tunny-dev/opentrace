"use client";

import PropTypes from 'prop-types';
import { FileText, Download, ExternalLink, HardDrive, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { systemLogsService } from '@/services/system-logs.service';
import { useSystemLogFiles } from '@/hooks/useSystemLogs';

export function FilesModal({ isOpen, onClose, selectedDate }) {
  const {
    data: files = [],
    isLoading: loading,
    error: queryError,
    refetch: loadFiles,
  } = useSystemLogFiles(selectedDate, { enabled: isOpen });

  const error = queryError ? queryError.message || 'Error loading log file list.' : '';

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="w-[94vw] max-w-3xl lg:max-w-4xl sm:max-w-none dark:bg-[#181b1f] bg-white dark:border-[#22252b] border-slate-200 dark:text-[#f4f5f7] text-slate-800 p-6 shadow-2xl flex flex-col max-h-[85vh] rounded-lg"
          style={{ width: '94vw', maxWidth: '896px' }}
        >
          <DialogHeader className="border-b dark:border-[#22252b] border-slate-200 pb-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#3274d9]/15 text-[#5794f2] border border-[#3274d9]/30">
                <HardDrive className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold dark:text-white text-slate-900 tracking-tight">
                System Log Files Browser
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs dark:text-[#8e94a0] text-slate-500 flex items-center gap-2 mt-1.5 font-sans">
              <Calendar className="h-3.5 w-3.5 text-[#5794f2]" />
              <span>Date:</span>
              <strong className="dark:text-white text-slate-900 font-semibold">
                {selectedDate}
              </strong>
              <span className="text-slate-400">&bull;</span>
              <span>
                Total <strong className="text-[#3274d9] dark:text-[#5794f2]">{files.length}</strong>{' '}
                log files (.log &amp; .json)
              </span>
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded border border-[#f2495c]/40 bg-[#f2495c]/10 p-3 text-xs text-[#f2495c] flex items-center justify-between shrink-0">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadFiles()}
                className="h-6 text-xs border-[#f2495c]/40 text-[#f2495c] hover:bg-[#f2495c]/20"
              >
                Retry
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1 max-h-[62vh] pr-2 my-1">
            {loading ? (
              <div className="py-16 text-center text-xs dark:text-[#8e94a0] text-slate-500">
                Scanning log files on server...
              </div>
            ) : files.length === 0 ? (
              <div className="py-16 text-center text-xs dark:text-[#8e94a0] text-slate-500">
                No log files found for this date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {files.map((f, idx) => {
                  const isJson = f.format === 'JSON';
                  const isDapper = f.category.includes('Dapper');
                  const isErr = f.category.includes('Error');

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 rounded border dark:border-[#22252b] border-slate-200 dark:bg-[#111217] bg-slate-50/80 p-3.5 transition hover:dark:bg-[#22252b]/40 hover:bg-slate-100/70 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border ${
                            isJson
                              ? 'border-[#5794f2]/40 bg-[#5794f2]/10 text-[#5794f2]'
                              : 'border-[#73bf69]/40 bg-[#73bf69]/10 text-[#73bf69]'
                          }`}
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-sm font-semibold dark:text-white text-slate-900 truncate">
                            {f.name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs dark:text-[#8e94a0] text-slate-500 font-sans">
                            <span
                              className={`rounded px-2 py-0.5 text-[11px] font-medium border ${
                                isDapper
                                  ? 'border-[#73bf69]/40 text-[#73bf69] bg-[#73bf69]/10'
                                  : isErr
                                    ? 'border-[#f2495c]/40 text-[#f2495c] bg-[#f2495c]/10'
                                    : 'dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700'
                              }`}
                            >
                              {f.category}
                            </span>
                            <span className="font-sans dark:text-[#f4f5f7] text-slate-800 font-medium">
                              {f.size}
                            </span>
                            <span className="text-slate-400 select-none">�</span>
                            <span className="text-[11px]">{f.lastModified}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={systemLogsService.getDownloadUrl(f.path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs border dark:border-[#2c323f] border-slate-300 dark:bg-[#181b1f] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:text-white hover:text-slate-900 hover:dark:bg-[#22252b] hover:bg-slate-100 transition shadow-sm font-medium cursor-pointer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View Raw
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Open raw log content in new tab</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={systemLogsService.getDownloadUrl(f.path)}
                              download
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs bg-[#3274d9] hover:bg-[#2463eb] text-white transition font-medium shadow-sm cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Download file to disk</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end border-t dark:border-[#22252b] border-slate-200 pt-3.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="dark:border-[#2c323f] border-slate-300 dark:bg-[#111217] bg-white dark:text-[#c7d0d9] text-slate-700 hover:dark:text-white hover:dark:bg-[#22252b] text-xs h-8 px-4 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

FilesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDate: PropTypes.string.isRequired,
};
