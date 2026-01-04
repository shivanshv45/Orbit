import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Presentation, Image, FileSpreadsheet, X, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'ppt' | 'doc' | 'image' | 'text' | 'other';
  size: string;
  status: 'uploading' | 'processing' | 'ready';
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
  onFilesReady: () => void;
}

export function FileUploader({ onFilesReady }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = droppedFiles.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      type: getFileType(file.name),
      size: formatFileSize(file.size),
      status: 'uploading' as const,
    }));
    
    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload and processing
    newFiles.forEach((file, index) => {
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' as const } : f
        ));
      }, 500 + index * 200);

      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'ready' as const } : f
        ));
      }, 1500 + index * 300);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleStartLearning = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onFilesReady();
    }, 2000);
  };

  const allFilesReady = files.length > 0 && files.every(f => f.status === 'ready');

  // Add mock files for demo
  const addMockFiles = () => {
    const mockFiles: UploadedFile[] = [
      { id: 'mock-1', name: 'Physics_Chapter_4_Newton.pdf', type: 'pdf', size: '2.4 MB', status: 'ready' },
      { id: 'mock-2', name: 'Lecture_Slides_Forces.pptx', type: 'ppt', size: '5.1 MB', status: 'ready' },
      { id: 'mock-3', name: 'Previous_Year_Questions.pdf', type: 'pdf', size: '890 KB', status: 'ready' },
      { id: 'mock-4', name: 'Study_Notes.txt', type: 'text', size: '12 KB', status: 'ready' },
    ];
    setFiles(mockFiles);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-8">
      {/* Upload Zone */}
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
        onClick={addMockFiles}
      >
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

        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
        </div>
      </motion.div>

      {/* Uploaded Files */}
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

      {/* Start Learning Button */}
      <AnimatePresence>
        {allFilesReady && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pt-4"
          >
            <button
              onClick={handleStartLearning}
              disabled={isProcessing}
              className={cn(
                "w-full h-14 rounded-2xl font-medium text-lg transition-all duration-300",
                "bg-primary text-primary-foreground",
                "hover:scale-[1.02] hover:shadow-glow",
                "disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100",
                isProcessing && "animate-pulse"
              )}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Building your learning path...
                </span>
              ) : (
                'Start Learning'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
