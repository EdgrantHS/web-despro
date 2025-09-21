'use client'
import { assets } from '@/assets/public/assets'
import Image from 'next/image'
import React, { useRef, useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const qrRegionId = "qr-reader-region"

interface ScanResult {
    name?: string;
    NPM?: string;
    image?: string;
    jumlah?: number;
    sumber?: string;
    waktuKirim?: string;
    raw?: string;
    [key: string]: any;
}

const Page = () => {
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)

    const startScanning = () => {
        setIsScanning(true)
    }

    // Handle scanner initialization when isScanning becomes true
    useEffect(() => {
        let mounted = true

        const initializeScanner = async () => {
            if (!isScanning) return

            try {
                // Wait a bit for DOM to update
                await new Promise(resolve => setTimeout(resolve, 100))
                
                // Check if component is still mounted and element exists
                if (!mounted) return
                
                const element = document.getElementById(qrRegionId)
                if (!element) {
                    console.error(`Element with id ${qrRegionId} not found`)
                    setIsScanning(false)
                    return
                }
                
                scannerRef.current = new Html5Qrcode(qrRegionId)
                
                await scannerRef.current.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 200, height: 200 },
                    },
                    (decodedText: string) => {
                        if (mounted) {
                            handleScanSuccess(decodedText)
                        }
                    },
                    (errorMessage: string) => {
                        // ignore scan errors during scanning
                    }
                )
            } catch (err) {
                console.error("Error starting scanner:", err)
                if (mounted) {
                    setIsScanning(false)
                }
            }
        }

        if (isScanning) {
            initializeScanner()
        }

        return () => {
            mounted = false
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {})
                scannerRef.current.clear().catch(() => {})
                scannerRef.current = null
            }
        }
    }, [isScanning])

    const handleScanSuccess = async (decodedText: string) => {
        console.log("Raw scan result:", decodedText)
        
        // Stop scanner first
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                await scannerRef.current.clear()
                scannerRef.current = null
            } catch (err) {
                console.error("Error stopping scanner:", err)
            }
        }
        
        setIsScanning(false)
        
        // Parse result - handle both JSON and JS object literal formats
        let parsedResult: ScanResult
        try {
            // First try: standard JSON.parse
            parsedResult = JSON.parse(decodedText)
            console.log("Parsed as valid JSON:", parsedResult)
        } catch {
            try {
                // Second try: convert JS object literal to valid JSON
                let jsonString = decodedText.trim()
                
                // Convert JS object literal to JSON format
                jsonString = jsonString
                    // Replace unquoted keys with quoted keys
                    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
                    // Replace single quotes with double quotes
                    .replace(/'/g, '"')
                
                console.log("Converted string:", jsonString)
                parsedResult = JSON.parse(jsonString)
                console.log("Successfully parsed converted object:", parsedResult)
            } catch (conversionError) {
                // If conversion fails, store as raw
                parsedResult = { raw: decodedText }
                console.log("Could not parse as object, storing as raw:", parsedResult)
                console.error("Parsing error:", conversionError)
            }
        }
        
        setScanResult(parsedResult)
        
        // Here you can add your database POST logic
        // await postToDatabase(parsedResult)
    }

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                await scannerRef.current.clear()
                scannerRef.current = null
            } catch (err) {
                console.error("Error stopping scanner:", err)
            }
        }
        setIsScanning(false)
    }

    const resetScan = () => {
        setScanResult(null)
    }

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        return dateString
    }

    return (
        <div className=''>
            {/* Content */}
            <div className='flex-1 flex flex-col justify-between items-center gap-28 px-6 relative'>
                
                {/* Title */}
                <div className='text-center mb-8'>
                    <h1 className='text-4xl font-bold text-gray-800 mb-2'>Scan QR</h1>
                    <p className='text-sm text-gray-600'>Align QR within frame</p>
                </div>

                {/* Scanner Frame */}
                <div className='relative mb-8'>
                    {/* QR Frame Container */}
                    <div className='relative w-64 h-64 bg-white rounded-lg overflow-hidden'>
                        
                        {/* Scanner region - only shows when scanning */}
                        {isScanning && (
                            <div
                                id={qrRegionId}
                                className="absolute inset-2 aspect-square z-10"
                            />
                        )}
                        
                        {/* Corner borders - always visible */}
                        <div className="absolute top-2 left-2 w-8 h-8 border-t-8 border-l-8 border-gray-800 rounded-tl-md z-20"></div>
                        <div className="absolute top-2 right-2 w-8 h-8 border-t-8 border-r-8 border-gray-800 rounded-tr-md z-20"></div>
                        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-8 border-l-8 border-gray-800 rounded-bl-md z-20"></div>
                        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-8 border-r-8 border-gray-800 rounded-br-md z-20"></div>
                        
                        {/* Placeholder content when not scanning */}
                        {!isScanning && !scanResult && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-gray-400">
                                    <div className="w-16 h-16 mx-auto mb-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                                    </div>
                                    <p className="text-xs">QR Code</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="w-full max-w-xs">
                    {!isScanning && !scanResult && (
                        <button
                            className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium"
                            onClick={startScanning}
                        >
                            <Image src={assets.scan} className='w-4 h-4' alt="Scan Icon" />
                            Scan QR Code
                        </button>
                    )}

                    {isScanning && (
                        <button
                            className="w-full bg-red-500 text-white py-3 px-6 rounded-lg font-medium"
                            onClick={stopScanning}
                        >
                            Stop Scanning
                        </button>
                    )}

                    {scanResult && (
                        <button
                            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium"
                            onClick={resetScan}
                        >
                            Scan Again
                        </button>
                    )}
                </div>
            </div>

            {/* Result Modal */}
            {scanResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 pb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">QRScan</h2>
                                <button
                                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                    onClick={() => setScanResult(null)}
                                >
                                    ×
                                </button>
                            </div>
                            
                            {/* Product Title */}
                            <h3 className="text-lg font-semibold text-gray-800 text-center mb-6">
                                {scanResult.name || 'Nama Produk, bisa 2 baris jika text terlalu panjang'}
                            </h3>
                        </div>

                        {/* Product Image */}
                        <div className="px-6 mb-6">
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {scanResult.image ? (
                                    <img 
                                        src={scanResult.image} 
                                        alt="Product" 
                                        className="w-full h-full object-cover rounded-lg"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`text-center text-gray-400 ${scanResult.image ? 'hidden' : ''}`}>
                                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                                    </div>
                                    <p className="text-xs">No Image</p>
                                </div>
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="px-6 space-y-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Jumlah</span>
                                <span className="text-gray-800 font-medium">{scanResult.jumlah || '10'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Sumber</span>
                                <span className="text-gray-800 font-medium">{scanResult.sumber || 'Node A'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Waktu Kirim</span>
                                <span className="text-gray-800 font-medium text-right text-sm">
                                    {formatDateTime(scanResult.waktuKirim)}
                                </span>
                            </div>

                            {/* Show other properties if available */}
                            {Object.entries(scanResult)
                                .filter(([key]) => !['name', 'image', 'jumlah', 'sumber', 'waktuKirim', 'raw'].includes(key))
                                .map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm capitalize">{key}</span>
                                        <span className="text-gray-800 font-medium">{String(value)}</span>
                                    </div>
                                ))}

                            {/* Show raw data if parsing failed */}
                            {scanResult.raw && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Raw Data:</p>
                                    <p className="text-xs text-gray-800 break-all">{scanResult.raw}</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Button */}
                        <div className="px-6 pb-6">
                            <button
                                className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-medium"
                                onClick={() => setScanResult(null)}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Page