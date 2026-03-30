import { useEffect, useRef, useState } from 'react';

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  directory?: boolean;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

export default function FileDropZone({
  onFiles,
  accept,
  multiple = true,
  directory = false,
  label = 'Drop files here',
  sublabel,
  disabled = false,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // React 19 sets webkitdirectory as a DOM boolean property ('' → false).
  // setAttribute is the only reliable way to activate the folder picker.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (directory) {
      el.setAttribute('webkitdirectory', '');
    } else {
      el.removeAttribute('webkitdirectory');
    }
  }, [directory]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    if (arr.length > 0) onFiles(arr);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); !disabled && inputRef.current?.click(); } }}
      className={[
        'flex flex-col items-center justify-center gap-3',
        'border-2 border-dashed rounded-xl p-10 cursor-pointer',
        'transition-colors duration-150',
        isDragOver && !disabled ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className="text-3xl" aria-hidden="true">📂</span>
      <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
      {sublabel && <span className="text-xs text-gray-500 text-center">{sublabel}</span>}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

