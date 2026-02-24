import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Code, 
  Download, 
  Upload, 
  Clipboard, 
  Sun, 
  Moon, 
  Trash2, 
  AlertCircle,
  Settings2,
  ChevronDown,
  Check,
  ExternalLink,
  Mail,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  detectFormat, 
  csvToJson, 
  jsonToCsv, 
  downloadFile, 
  exportToXlsx, 
  jsonToXml,
  Format 
} from './lib/converter';

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [inputFormat, setInputFormat] = useState<Format>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t' | '|'>(',');
  const [encoding, setEncoding] = useState('UTF-8');
  const [hasHeader, setHasHeader] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const outputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleConversion = useCallback((text: string) => {
    if (!text.trim()) {
      setOutput('');
      setInputFormat('unknown');
      setError(null);
      return;
    }

    const format = detectFormat(text);
    setInputFormat(format);
    setError(null);

    if (format === 'csv') {
      const result = csvToJson(text, { 
        delimiter, 
        header: hasHeader 
      });
      if (result.error) {
        setError(result.error);
        setOutput('');
      } else {
        setOutput(JSON.stringify(result.data, null, 2));
      }
    } else if (format === 'json') {
      try {
        const result = jsonToCsv(text);
        if (result.error) {
          setError(result.error);
          setOutput('');
        } else {
          setOutput(result.data);
        }
      } catch (err: any) {
        setError('Invalid JSON format');
        setOutput('');
      }
    } else {
      setError('Format not recognized. Please check your input.');
      setOutput('');
    }
  }, [delimiter, hasHeader]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleConversion(input);
    }, 300);
    return () => clearTimeout(timer);
  }, [input, handleConversion]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInput(content);
      };
      reader.readAsText(file, encoding);
    }
  }, [encoding]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    multiple: false
  } as any);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = (format: 'txt' | 'csv' | 'json' | 'xlsx' | 'xml') => {
    if (!output) return;

    const fileName = `converted_data_${new Date().getTime()}`;

    if (format === 'xlsx') {
      const data = inputFormat === 'csv' ? JSON.parse(output) : JSON.parse(input);
      exportToXlsx(data, fileName);
      return;
    }

    let content = output;
    let mimeType = 'text/plain';

    if (format === 'xml') {
      const data = inputFormat === 'csv' ? JSON.parse(output) : JSON.parse(input);
      content = jsonToXml(data);
      mimeType = 'application/xml';
    } else if (format === 'json') {
      content = inputFormat === 'csv' ? output : input;
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = inputFormat === 'json' ? output : input;
      mimeType = 'text/csv';
    }

    downloadFile(content, `${fileName}.${format}`, mimeType);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0a] text-stone-900 dark:text-stone-100 font-sans selection:bg-csv/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-[#0a0a0a]/70 border-bottom border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-csv rounded-xl flex items-center justify-center text-white shadow-lg shadow-csv/20">
              <FileText size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              CSV <span className="text-csv">JSON</span> CONVERTER
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="Configuración"
            >
              <Settings2 size={20} />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="Cambiar tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8" {...getRootProps()}>
        <input {...getInputProps()} />
        
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Separador CSV
                  </label>
                  <div className="flex gap-2">
                    {([',', ';', '\t', '|'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setDelimiter(s)}
                        className={cn(
                          "px-4 py-2 rounded-lg border text-sm transition-all",
                          delimiter === s 
                            ? "bg-csv border-csv text-white shadow-md" 
                            : "border-stone-200 dark:border-stone-700 hover:border-csv"
                        )}
                      >
                        {s === '\t' ? 'Tab' : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Codificación
                  </label>
                  <select
                    value={encoding}
                    onChange={(e) => setEncoding(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent text-sm"
                  >
                    <option value="UTF-8">UTF-8</option>
                    <option value="ISO-8859-1">ISO-8859-1</option>
                    <option value="Windows-1252">Windows-1252</option>
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setHasHeader(!hasHeader)}
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        hasHeader ? "bg-csv border-csv text-white" : "border-stone-300 dark:border-stone-600"
                      )}
                    >
                      {hasHeader && <Check size={14} />}
                    </div>
                    <span className="text-sm font-medium">CSV tiene cabecera</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag & Drop Overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-csv/20 backdrop-blur-sm flex items-center justify-center p-8 pointer-events-none"
            >
              <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border-4 border-dashed border-csv flex flex-col items-center gap-4 shadow-2xl">
                <Upload size={64} className="text-csv animate-bounce" />
                <p className="text-2xl font-bold">Suelta tus archivos aquí</p>
                <p className="text-stone-500">CSV, JSON o TXT</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                  inputFormat === 'csv' ? "bg-csv/10 text-csv" : 
                  inputFormat === 'json' ? "bg-json/10 text-json" : 
                  "bg-stone-200 dark:bg-stone-800 text-stone-500"
                )}>
                  {inputFormat === 'unknown' ? 'Entrada' : inputFormat}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePaste}
                  className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-500 hover:text-csv"
                  title="Pegar"
                >
                  <Clipboard size={18} />
                </button>
                <label className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-500 hover:text-csv cursor-pointer" title="Importar archivo">
                  <Upload size={18} />
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onDrop([file]);
                  }} />
                </label>
                <button
                  onClick={() => setInput('')}
                  className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-500 hover:text-red-500"
                  title="Limpiar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pega tu CSV o JSON aquí, o arrastra un archivo..."
                className={cn(
                  "w-full h-[500px] p-6 rounded-2xl border bg-white dark:bg-stone-900 font-mono text-sm resize-none focus:outline-none transition-all",
                  inputFormat === 'csv' ? "border-csv/50 focus:border-csv shadow-lg shadow-csv/5" :
                  inputFormat === 'json' ? "border-json/50 focus:border-json shadow-lg shadow-json/5" :
                  "border-stone-200 dark:border-stone-800 focus:border-stone-400"
                )}
              />
              {input.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                  <Upload size={48} className="mb-4" />
                  <p className="text-lg font-medium">Arrastra y suelta archivos</p>
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                  inputFormat === 'csv' ? "bg-json/10 text-json" : 
                  inputFormat === 'json' ? "bg-csv/10 text-csv" : 
                  "bg-stone-200 dark:bg-stone-800 text-stone-500"
                )}>
                  {inputFormat === 'csv' ? 'JSON' : inputFormat === 'json' ? 'CSV' : 'Resultado'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium",
                    copySuccess ? "text-green-500" : "text-stone-500 hover:text-csv hover:bg-stone-200 dark:hover:bg-stone-800"
                  )}
                  title="Copiar"
                >
                  {copySuccess ? <Check size={18} /> : <Clipboard size={18} />}
                </button>
                
                <div className="relative group/download">
                  <button className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors text-stone-500 hover:text-csv flex items-center gap-1">
                    <Download size={18} />
                    <ChevronDown size={14} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl opacity-0 invisible group-hover/download:opacity-100 group-hover/download:visible transition-all z-50">
                    <div className="p-2 flex flex-col gap-1">
                      {(['txt', 'csv', 'json', 'xlsx', 'xml'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => handleDownload(f)}
                          className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-sm font-medium uppercase"
                        >
                          Descargar .{f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={outputRef}
                readOnly
                value={output}
                placeholder="El resultado aparecerá aquí automáticamente..."
                className={cn(
                  "w-full h-[500px] p-6 rounded-2xl border bg-white dark:bg-stone-900 font-mono text-sm resize-none focus:outline-none transition-all",
                  inputFormat === 'csv' ? "border-json/50 shadow-lg shadow-json/5" :
                  inputFormat === 'json' ? "border-csv/50 shadow-lg shadow-csv/5" :
                  "border-stone-200 dark:border-stone-800"
                )}
              />
              
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-6 left-6 right-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 shadow-lg"
                  >
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Error de formato</p>
                      <p className="text-xs opacity-90">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Features Info */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="w-12 h-12 bg-csv/10 text-csv rounded-xl flex items-center justify-center mb-4">
              <Settings2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Detección Inteligente</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Detectamos automáticamente si tu entrada es CSV o JSON y realizamos la conversión en tiempo real sin que tengas que pulsar nada.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="w-12 h-12 bg-json/10 text-json rounded-xl flex items-center justify-center mb-4">
              <Download size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Múltiples Formatos</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Exporta tus datos a CSV, JSON, Excel (XLSX), XML o texto plano. Todo el procesamiento se realiza de forma segura en tu navegador.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Validación Robusta</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Manejo avanzado de CSV con diferentes separadores, comillas escapadas y saltos de línea. Validación de JSON anidado y tipos complejos.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Section */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-csv rounded-xl flex items-center justify-center text-white shadow-lg shadow-csv/20">
                <FileText size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight uppercase">CSV JSON CONVERTER</span>
            </div>
            <p className="text-stone-500 text-sm max-w-2xl leading-relaxed">
              Herramienta gratuita y de código abierto para la conversión rápida de datos. 
              <br className="hidden md:block" />
              Privacidad garantizada: tus datos nunca salen de tu dispositivo.
            </p>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-stone-100 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-stone-400 text-xs order-2 md:order-1">
              Aitor Sánchez Gutiérrez © 2026 - Reservados todos los derechos
            </p>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 order-1 md:order-2">
              <a href="https://aitorblog.infinityfreeapp.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-csv transition-colors font-medium">
                <ExternalLink size={16} /> Mi Blog
              </a>
              <a href="mailto:blog.cottage627@passinbox.com" className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-csv transition-colors font-medium">
                <Mail size={16} /> Contacto
              </a>
              <a href="https://aitorhub.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-csv transition-colors font-medium">
                <Github size={16} /> Más Apps
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
