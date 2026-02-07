import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Presentation, Image, FileSpreadsheet, X, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createOrGetUser } from '@/logic/userSession';
import { useUser } from '@clerk/clerk-react';

interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'ppt' | 'doc' | 'image' | 'text' | 'other';
  size: string;
  status: 'uploading' | 'processing' | 'ready';
  file: File;
}

const fileTypeConfig = {
  pdf: { icon: FileText, label: 'PDF', color: 'text-red-500' },
  ppt: { icon: Presentation, label: 'PPT', color: 'text-orange-500' },
  doc: { icon: FileText, label: 'DOC', color: 'text-blue-500' },
  image: { icon: Image, label: 'IMG', color: 'text-purple-500' },
  text: { icon: FileText, label: 'TXT', color: 'text-muted-foreground' },
  other: { icon: FileText, label: 'FILE', color: 'text-muted-foreground' },
};

interface FileUploaderProps {
  onUploadComplete: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const { user, isLoaded } = useUser();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getFileType = (fileName: string): UploadedFile['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['ppt', 'pptx'].includes(ext || '')) return 'ppt';
    if (['doc', 'docx'].includes(ext || '')) return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (['txt', 'md'].includes(ext || '')) return 'text';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    const newFiles: UploadedFile[] = fileArray.map((file, index) => {
      const lastDotIndex = file.name.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? file.name.slice(0, lastDotIndex) : file.name;
      const extension = lastDotIndex !== -1 ? file.name.slice(lastDotIndex) : '';
      const sanitizedBase = baseName.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();

      return {
        id: `file-${Date.now()}-${index}`,
        name: (sanitizedBase || 'Untitled') + extension,
        type: getFileType(file.name),
        size: formatFileSize(file.size),
        status: 'uploading' as const,
        file: file,
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleStartLearning = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const filesToUpload = files.filter(f => f.status === 'uploading' || f.status === 'ready' || f.status === 'processing');

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) {
          return prev + Math.random() * 4;
        }

        if (prev >= 30 && prev < 33) {
          return prev + 0.05;
        }

        if (prev < 66) {
          return prev + Math.random() * 2;
        }

        if (prev >= 66 && prev < 69) {
          return prev + 0.05;
        }

        if (prev < 92) {
          return prev + Math.random() * 0.5;
        }

        return Math.min(95, prev + 0.02);
      });
    }, 200);

    if (filesToUpload.length === 0) {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        onUploadComplete();
      }, 500);
      return;
    }

    setFiles(prev => prev.map(f =>
      filesToUpload.some(fu => fu.id === f.id)
        ? { ...f, status: 'processing' as const }
        : f
    ));

    try {
      const userSession = createOrGetUser(user ? { id: user.id, fullName: user.fullName } : null, isLoaded);
      const formData = new FormData();

      filesToUpload.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });

      const response = await fetch(`${API_BASE_URL}/parse`, {
        method: 'POST',
        headers: {
          'X-User-Id': userSession.uid,
          'X-User-Name': 'User',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to parse files: ${errorText}`);
      }

      await response.json();

      setFiles(prev => prev.map(f => ({ ...f, status: 'ready' as const })));

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onUploadComplete();
      }, 800);
    } catch (err) {
      console.error('Error uploading files:', err);
      clearInterval(progressInterval);
      setFiles(prev => prev.map(f =>
        filesToUpload.some(fu => fu.id === f.id)
          ? { ...f, status: 'uploading' as const }
          : f
      ));
      setIsProcessing(false);
      setProgress(0);
      setError('Failed to upload files. Please check your connection and try again.');
    }
  };

  const allFilesReady = files.length > 0 && files.some(f => f.status === 'uploading' || f.status === 'ready' || f.status === 'processing');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "upload-zone cursor-pointer relative overflow-hidden group",
          isDragging && "border-primary bg-accent/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="text-center space-y-4">
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent"
          >
            <Upload className="w-8 h-8 text-primary" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              Upload everything you have
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              PDFs, slides, notes, previous year questions — the system will analyze and organize it all.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Click to add demo files or drag & drop your materials
          </p>
        </div>

        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-shimmer"
            style={{ backgroundSize: '200% 100%' }} />
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} added
              </span>
              {allFilesReady && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-xs text-complete"
                >
                  <Check className="w-3.5 h-3.5" />
                  All files analyzed
                </motion.span>
              )}
            </div>

            <div className="grid gap-2">
              {files.map((file, index) => {
                const config = fileTypeConfig[file.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 group"
                  >
                    <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.size}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <span className="text-xs text-muted-foreground">Uploading...</span>
                      )}
                      {file.status === 'processing' && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-1.5 text-xs text-primary"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          Analyzing
                        </motion.span>
                      )}
                      {file.status === 'ready' && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-center w-5 h-5 rounded-full bg-complete/10"
                        >
                          <Check className="w-3 h-3 text-complete" />
                        </motion.span>
                      )}

                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {allFilesReady && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pt-4"
          >
            {isProcessing ? (
              <div className="w-full relative h-14 bg-muted/30 rounded-2xl border border-primary/20 overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary/10"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                >
                  <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-primary/40 to-transparent" />
                </motion.div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-medium text-foreground tracking-wide animate-pulse">
                    Building your learning path...
                  </span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]" />
              </div>
            ) : (
              <button
                onClick={handleStartLearning}
                disabled={isProcessing}
                className={cn(
                  "w-full h-14 rounded-2xl font-medium text-lg transition-all duration-300",
                  "bg-primary text-primary-foreground",
                  "hover:scale-[1.02] hover:shadow-glow",
                  "disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100",
                )}
              >
                Start Learning
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
