'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function QRScanDevPage() {
  const [scanResult, setScanResult] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsScanning(false);
  };

  // Process QR code result
  const processQRResult = async (qrString: string) => {
    if (!qrString.trim()) {
      setError('Empty QR code string');
      return;
    }

    setScanResult(qrString);
    
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
          return;
        }
      }
      
      // Check if it's just a UUID (new format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qrString.trim())) {
        await handleQRScan(qrString.trim(), qrString);
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
        console.log('QR content is not a URL or UUID:', qrString);
      }
    }
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
          courier_name: 'Dev User',
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

  // Handle manual input
  const handleManualScan = async () => {
    if (manualInput.trim()) {
      await processQRResult(manualInput.trim());
      setManualInput('');
    }
  };

  // Capture frame from video for QR detection (placeholder - would need QR library)
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Here you would typically use a QR code detection library
        // For now, we'll just show a placeholder message
        setError('QR detection library not implemented. Use manual input for testing.');
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [cameraStream]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access QR scanner</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Scanner - Development</h1>
        <p className="text-gray-600">
          Scan QR codes using camera or enter QR content manually for testing
        </p>
        <Badge className="mt-2 bg-yellow-100 text-yellow-800">
          🧪 Development Mode
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera Scanner Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📱 Camera Scanner</h2>
          
          <div className="mb-4">
            {!isScanning ? (
              <Button onClick={startCamera} className="w-full">
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="w-full">
                Stop Camera
              </Button>
            )}
          </div>

          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-gray-100 rounded border object-cover"
                  playsInline
                />
                <div className="absolute inset-4 border-2 border-blue-500 border-dashed rounded opacity-50"></div>
              </div>
              
              <Button onClick={captureFrame} className="w-full">
                📸 Capture & Scan Frame
              </Button>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="text-sm text-gray-500 text-center">
                Position QR code within the frame and tap capture
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">⌨️ Manual Input</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-input">QR Code Content</Label>
              <Input
                id="manual-input"
                placeholder="Enter QR code content here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              />
            </div>
            
            <Button 
              onClick={handleManualScan} 
              disabled={!manualInput.trim()}
              className="w-full"
            >
              Process QR Content
            </Button>

          </div>
        </div>
      </div>

      {/* Scan Result Section */}
      {scanResult && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Scan Result</h3>
          <div className="bg-white p-4 rounded border font-mono text-sm">
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
          <div className="space-y-2">
            {scanHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                <span className="font-mono text-sm truncate flex-1 mr-4">
                  {item}
                </span>
                <div className="flex gap-1">
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

      {/* Development Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🔧 Development Notes</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Camera scanner requires QR detection library integration (e.g., jsQR, qr-scanner)</li>
          <li>• Manual input allows testing without camera access</li>
          <li>• Local URLs are automatically navigated to</li>
          <li>• Scan history helps with repeated testing</li>
          <li>• Use this page for QR content development and testing</li>
        </ul>
      </div>
    </div>
  );
}