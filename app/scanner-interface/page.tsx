'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function ScannerInterfacePage() {
  const [scanResult, setScanResult] = useState<string>('');
  const [scanInput, setScanInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Process QR code result
  const processQRResult = async (qrString: string) => {
    if (!qrString.trim()) {
      setError('Empty scanner input');
      return;
    }

    setIsProcessing(true);
    setScanResult('Processing...');
    
    // Add to history if not already there
    setScanHistory(prev => {
      const newHistory = [qrString, ...prev.filter(item => item !== qrString)];
      return newHistory.slice(0, 10); // Keep only last 10 scans
    });

    // Check if it's a QR scan URL pattern
    try {
      // Extract QR ID from URL like: http://localhost:3000/api/qr/scan/249ca59f-7842-4506-8b5a-a919cbd6fd22
      if (qrString.includes('/api/qr/scan/') || qrString.includes('/qr/scan/')) {
        const qrId = qrString.split('/').pop();
        if (qrId) {
          await handleQRScan(qrId, qrString);
          setIsProcessing(false);
          return;
        }
      }
      
      // Try to parse and redirect if it's a valid internal URL
      const url = new URL(qrString);
      if (url.hostname === window.location.hostname || qrString.startsWith('/')) {
        // It's a local URL that's not a QR scan, navigate to it
        const path = qrString.startsWith('http') ? url.pathname + url.search : qrString;
        router.push(path);
      }
    } catch {
      // Not a URL, just display the result
      setScanResult(`Scanner Input Received: ${qrString}`);
      console.log('Scanner content is not a URL:', qrString);
    }
    
    setIsProcessing(false);
  };

  // Handle QR scan API call (similar to the main qr-scan page)
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
        // Update scan result with formatted API response
        const formattedResult = `QR Scan Success!
        
Original URL: ${originalUrl}
QR ID: ${qrId}

Item Information:
- Name: ${result.data.item_instance?.item_name || 'N/A'}
- Type: ${result.data.item_instance?.item_type || 'N/A'}
- Count: ${result.data.item_transit_count || 'N/A'}

Transit Information:
- Source: ${result.data.source_node?.name || 'N/A'}
- Destination: ${result.data.destination_node?.name || 'N/A'}
- Status: ${result.data.status || 'N/A'}

API Response: ${JSON.stringify(result.data, null, 2)}`;
        
        setScanResult(formattedResult);
      } else {
        setError(`QR Scan Failed: ${result.message || 'Unknown error'}`);
        setScanResult(`QR Scan Error: ${result.message || 'API returned unsuccessful response'}`);
      }
    } catch (err) {
      const errorMsg = `Network error scanning QR ID ${qrId}: ${err}`;
      setError(errorMsg);
      setScanResult(errorMsg);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access Scanner Interface</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scanner Interface</h1>
        <p className="text-gray-600">
          Hardware barcode/QR scanner interface - scan items and press Enter
        </p>
        <Badge className="mt-2 bg-green-100 text-green-800">
          🔍 Scanner Ready
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Scanner Input Section */}
      <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-blue-200">
        <h2 className="text-2xl font-semibold mb-6 text-center">📟 Scanner Input</h2>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="scanner-input" className="text-lg font-medium">
              Scan or Type Code
            </Label>
            <Input
              ref={inputRef}
              id="scanner-input"
              placeholder="Point scanner here and scan, or type manually..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScannerInput}
              className="text-lg p-4 text-center font-mono"
              autoComplete="off"
              autoFocus
            />
            <div className="text-sm text-gray-500 text-center mt-2">
              Hardware scanners will automatically input here. Press Enter to process.
            </div>
          </div>
          
          <Button 
            onClick={handleManualProcess} 
            disabled={!scanInput.trim() || isProcessing}
            className="w-full text-lg py-4"
          >
            {isProcessing ? 'Processing...' : 'Process Code'}
          </Button>

          {/* Scanner Status Indicator */}
          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${
              isProcessing ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`}></div>
              {isProcessing ? 'Processing...' : 'Ready to Scan'}
            </div>
          </div>
        </div>
      </div>

      {/* Scan Result Section */}
      {scanResult && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Scan Result</h3>
          <div className="bg-white p-4 rounded border font-mono text-sm whitespace-pre-wrap">
            {scanResult}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              size="sm"
              onClick={() => navigator.clipboard.writeText(scanResult)}
            >
              📋 Copy
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setScanResult('')}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Scan History Section */}
      {scanHistory.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Scan History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scanHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                <span className="font-mono text-sm truncate flex-1 mr-4">
                  {item}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setScanInput(item);
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                  >
                    📝 Load
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => processQRResult(item)}
                  >
                    🔄 Rescan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(item)}
                  >
                    📋
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setScanHistory([])}
            className="mt-4"
          >
            Clear History
          </Button>
        </div>
      )}

      {/* Scanner Interface Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📟 Scanner Interface Guide</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Point your barcode/QR scanner at the input field and scan</li>
          <li>• Scanner input will automatically appear in the text box</li>
          <li>• Most scanners automatically press Enter after scanning</li>
          <li>• Input field stays focused for continuous scanning</li>
          <li>• Manual typing is also supported - press Enter when done</li>
          <li>• History keeps track of recent scans for reference</li>
        </ul>
      </div>
    </div>
  );
}