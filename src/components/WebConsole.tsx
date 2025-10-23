import React, { useState, useEffect } from 'react';
import { Terminal, X, ChevronDown, ChevronUp } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

const WebConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const addLog = (level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev.slice(-49), newLog]); // Garder seulement les 50 derniers logs
  };

  useEffect(() => {
    // Intercepter console.log, console.warn, console.error
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (message.includes('🔍') || message.includes('✅') || message.includes('❌') || message.includes('⚠️')) {
        const level = message.includes('✅') ? 'success' : 
                     message.includes('❌') ? 'error' : 
                     message.includes('⚠️') ? 'warn' : 'info';
        addLog(level, message);
      }
      
      originalLog(...args);
    };

    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('warn', message);
      originalWarn(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('error', message);
      originalError(...args);
    };

    // Ajouter un log initial
    addLog('info', '🚀 Console de diagnostic démarrée');

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', '🧹 Console effacée');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-2xl w-full max-h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">Console de Diagnostic</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {logs.length} logs
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearLogs}
            className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded"
          >
            Effacer
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <Terminal className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun log pour le moment...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded text-xs font-mono ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 flex-shrink-0">
                      [{log.timestamp}]
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-words">
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {isExpanded && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-600">
            💡 Cette console affiche les informations de diagnostic Supabase. 
            Elle sera supprimée une fois la connexion établie.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebConsole;