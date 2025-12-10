'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/utils/supabase/client';
import { ScanLine, LogOut, LayoutGrid, ArrowLeft, CheckCircle, XCircle, Clock, Copy, Trash2, RotateCcw } from 'lucide-react';

export default function ScannerInterfacePage() {
  const [scanResult, setScanResult] = useState<string>('');
  const [scanInput, setScanInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStatus, setScanStatus] = useState<'ready' | 'processing' | 'success' | 'error'>('ready');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Auto-focus the input on mount and keep focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Refocus input when clicking anywhere on the page
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Process QR code result
  const processQRResult = async (qrString: string) => {
    if (!qrString.trim()) {
      setError('Empty scanner input');
      setScanStatus('error');
      return;
    }

    setIsProcessing(true);
    setScanStatus('processing');
    setScanResult('Processing...');
    setError('');
    
    // Add to history if not already there
    setScanHistory(prev => {
      const newHistory = [qrString, ...prev.filter(item => item !== qrString)];
      return newHistory.slice(0, 10); // Keep only last 10 scans
    });

    // Check if it's a QR scan pattern (URL or UUID)
    try {
      // First check if it's a full URL with QR scan path
      if (qrString.includes('/api/qr/scan/') || qrString.includes('/qr/scan/')) {
        const qrId = qrString.split('/').pop();
        if (qrId) {
          await handleQRScan(qrId, qrString);
          setIsProcessing(false);
          return;
        }
      }
      
      // Check if it's just a UUID (new format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qrString.trim())) {
        await handleQRScan(qrString.trim(), qrString);
        setIsProcessing(false);
        return;
      }
      
      // Try to parse and redirect if it's a valid internal URL
      const url = new URL(qrString);
      if (url.hostname === window.location.hostname || qrString.startsWith('/')) {
        // It's a local URL that's not a QR scan, navigate to it
        const path = qrString.startsWith('http') ? url.pathname + url.search : qrString;
        router.push(path);
      }
    } catch {
      // Not a URL, check if it might be a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qrString.trim())) {
        await handleQRScan(qrString.trim(), qrString);
      } else {
        // Just display the result
        setScanResult(`Scanner Input Received: ${qrString}`);
        setScanStatus('success');
        console.log('Scanner content is not a URL or UUID:', qrString);
      }
    }
    
    setIsProcessing(false);
  };

  // Handle QR scan API call
  const handleQRScan = async (qrId: string, originalUrl: string) => {
    try {
      setError('');
      
      // Make POST request to QR scan API with courier info
      const response = await fetch(`/api/qr/scan/${qrId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          courier_name: 'Scanner User',
          courier_phone: '000-000-0000'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Format result nicely
        const formattedResult = `QR Scan Success!

Item Information:
• Name: ${result.data.item_instance?.item_name || 'N/A'}
• Type: ${result.data.item_instance?.item_type || 'N/A'}
• Count: ${result.data.item_transit_count || 'N/A'}

Transit Information:
• Source: ${result.data.source_node?.name || 'N/A'}
• Destination: ${result.data.destination_node?.name || 'N/A'}
• Status: ${result.data.status || 'N/A'}

QR ID: ${qrId}`;
        
        setScanResult(formattedResult);
        setScanStatus('success');
      } else {
        const errorMsg = `QR Scan Failed: ${result.message || 'Unknown error'}`;
        setError(errorMsg);
        setScanResult(errorMsg);
        setScanStatus('error');
      }
    } catch (err) {
      const errorMsg = `Network error: ${err}`;
      setError(errorMsg);
      setScanResult(errorMsg);
      setScanStatus('error');
    }
  };

  // Handle scanner input (triggered on Enter key or when scanner finishes)
  const handleScannerInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      await processQRResult(scanInput.trim());
      setScanInput(''); // Clear input for next scan
      
      // Refocus input for continuous scanning
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle manual process button
  const handleManualProcess = async () => {
    if (scanInput.trim()) {
      await processQRResult(scanInput.trim());
      setScanInput('');
      
      // Refocus input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const clearResult = () => {
    setScanResult('');
    setError('');
    setScanStatus('ready');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center bg-white font-sans">
        <div className="w-full max-w-md bg-white min-h-screen flex flex-col items-center justify-center sm:border-2 border-blue-600">
          <div className="text-center px-5">
            <p className="text-gray-600 mb-4">Please log in to access Scanner Interface</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-white font-sans">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col sm:border-2 border-blue-600 pb-12">
        {/* Header */}
        <div className="bg-blue-600 text-white py-4 px-5 rounded-b-3xl flex items-center justify-between gap-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <ScanLine className="w-5 h-5" />
            <h1 className="text-xl font-semibold">Scanner Interface</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-5 mt-5">
          {/* Status Badge */}
          <div className="mb-4 flex justify-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              scanStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
              scanStatus === 'success' ? 'bg-green-100 text-green-800' :
              scanStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {scanStatus === 'processing' && (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  Processing...
                </>
              )}
              {scanStatus === 'success' && (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Scan Success
                </>
              )}
              {scanStatus === 'error' && (
                <>
                  <XCircle className="w-4 h-4" />
                  Scan Error
                </>
              )}
              {scanStatus === 'ready' && (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Ready to Scan
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <div className="flex items-start justify-between">
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Scanner Input Section */}
          <div className="bg-white border-2 border-blue-400 rounded-xl p-5 shadow-sm mb-5">
            <h2 className="text-lg font-semibold text-blue-700 mb-3 text-center">Scanner Input</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="scanner-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Scan or Type Code
                </label>
                <input
                  ref={inputRef}
                  id="scanner-input"
                  type="text"
                  placeholder="Point scanner here and scan..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={handleScannerInput}
                  className="w-full px-4 py-3 text-base text-center font-mono border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Hardware scanners will automatically input here. Press Enter to process.
                </p>
              </div>
              
              <button
                onClick={handleManualProcess}
                disabled={!scanInput.trim() || isProcessing}
                className={`w-full py-3 rounded-xl font-medium text-white transition-colors ${
                  !scanInput.trim() || isProcessing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Process Code'}
              </button>
            </div>
          </div>

          {/* Scan Result Section */}
          {scanResult && (
            <div className={`mb-5 border-2 rounded-xl p-4 ${
              scanStatus === 'success' ? 'bg-green-50 border-green-200' :
              scanStatus === 'error' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-base font-semibold ${
                  scanStatus === 'success' ? 'text-green-800' :
                  scanStatus === 'error' ? 'text-red-800' :
                  'text-gray-800'
                }`}>
                  {scanStatus === 'success' ? '✅ Scan Result' : '📋 Result'}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(scanResult)}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={clearResult}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                    title="Clear"
                  >
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border font-mono text-xs whitespace-pre-wrap break-words">
                {scanResult}
              </div>
            </div>
          )}

          {/* Scan History Section */}
          {scanHistory.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scan History
                </h3>
                <button
                  onClick={() => setScanHistory([])}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scanHistory.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs truncate flex-1">
                      {item}
                    </span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setScanInput(item);
                          if (inputRef.current) {
                            inputRef.current.focus();
                          }
                        }}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                        title="Load"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => processQRResult(item)}
                        className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                        title="Rescan"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(item)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <ScanLine className="w-4 h-4" />
              How to Use
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Point your barcode/QR scanner at the input field</li>
              <li>• Scanner input will automatically appear</li>
              <li>• Most scanners automatically press Enter after scanning</li>
              <li>• Input field stays focused for continuous scanning</li>
              <li>• Manual typing is also supported</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
