'use client'
import { assets } from '@/assets/public/assets'
import Image from 'next/image'
import React, { useRef, useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { parse } from 'path'
import { ArrowLeft, ScanLine } from "lucide-react"
import { useRouter } from 'next/navigation'

const qrRegionId = "qr-reader-region"

interface ScanResult {
    item_name?: string;
    item_type?: string;
    source_node_name?: string;
    dest_node_name?: string;
    item_count?: number;
    status?: string;
    [key: string]: any;
}

const Page = () => {
    const router = useRouter()
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)

    // temporary
    const [courierName, setCourierName] = useState("Rahel");
    const [courierPhone, setCourierPhone] = useState("082130330030");

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
                scannerRef.current.stop().catch(() => { })
                // scannerRef.current.clear().catch(() => { })
                scannerRef.current = null
            }
        }
    }, [isScanning])

    const handleParseData = async (data: string) => {
        // Parse QR result
        let parsedResult: any;
        try {
            parsedResult = JSON.parse(data);
            // Jika hasil parsing bukan object, bungkus jadi object
            if (typeof parsedResult !== "object" || parsedResult === null || Array.isArray(parsedResult)) {
                parsedResult = { raw: data };
            }
        } catch {
            try {
                let jsonString = data.trim()
                    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
                    .replace(/'/g, '"');
                parsedResult = JSON.parse(jsonString);
                if (typeof parsedResult !== "object" || parsedResult === null || Array.isArray(parsedResult)) {
                    parsedResult = { raw: data };
                }
            } catch {
                parsedResult = { raw: data };
            }
        }

        // Gabungkan input kurir jika parsedResult adalah object
        if (typeof parsedResult === "object" && parsedResult !== null && !Array.isArray(parsedResult)) {
            parsedResult.courier_name = courierName;
            parsedResult.courier_phone = courierPhone;
        }

        return parsedResult;
    }

    const handleScanSuccess = async (decodedText: string) => {
        // Stop scanner first
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
                scannerRef.current = null;
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setIsScanning(false);

        // Ambil qrId dari path terakhir
        let qrId = "";
        try {
            const urlParts = decodedText.trim().split("/");
            qrId = urlParts[urlParts.length - 1];
        } catch {
            setScanResult({ raw: "QR format error" });
            return;
        }

        // Kirim ke API /api/qr/scan/[qrId]
        try {
            const res = await fetch(`/api/qr/scan/${qrId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courier_name: courierName,
                    courier_phone: courierPhone
                }),
            });

            const result = await res.json();
            console.log("Result from fetch:", result);
            
            if (result.success && result.data) {
                setScanResult({
                    item_name: result.data.item_instance?.item_name,
                    item_type: result.data.item_instance?.item_type,
                    source_node_name: result.data.source_node?.name,
                    dest_node_name: result.data.destination_node?.name,
                    item_count: result.data.item_transit_count,
                    status: result.data.status,
                });
                console.log("Result from API: ", result.data);
            } else {
                setScanResult({ raw: result.message || "API Failed" });
                console.error("API Error Result: ", result);
            }
        } catch (err) {
            setScanResult({ raw: "Network error" });
            console.error("Network error:", err);
        }
    };

     console.log("scanResult: ", scanResult);

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
        <div className="w-full min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div 
                className="bg-blue-600 text-white py-4 px-3 rounded-b-3xl flex items-center gap-2.5"
                style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
            >
                <button onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-semibold">Scan Qr Code</h1>
            </div>

            {/* QR Code Area */}
            <div className="flex-1 flex flex-col items-center justify-center mt-6 w-full px-5">
                {/* Scanner Frame */}
                <div className='relative mb-6'>
                    {/* QR Frame Container */}
                    <div className='relative w-56 h-56 bg-white rounded-lg overflow-hidden'>

                        {/* Scanner region - only shows when scanning */}
                        {isScanning && (
                            <div
                                id={qrRegionId}
                                className="absolute inset-2 aspect-square z-10"
                            />
                        )}

                        {/* Corner borders - always visible */}
                        <div className="absolute top-1.5 left-1.5 w-6 h-6 border-t-4 border-l-4 border-gray-800 rounded-tl-md z-20"></div>
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 border-t-4 border-r-4 border-gray-800 rounded-tr-md z-20"></div>
                        <div className="absolute bottom-1.5 left-1.5 w-6 h-6 border-b-4 border-l-4 border-gray-800 rounded-bl-md z-20"></div>
                        <div className="absolute bottom-1.5 right-1.5 w-6 h-6 border-b-4 border-r-4 border-gray-800 rounded-br-md z-20"></div>

                        {/* Placeholder content when not scanning */}
                        {!isScanning && !scanResult && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-gray-400">
                                    <div className="w-14 h-14 mx-auto mb-1.5 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                        <div className="w-7 h-7 bg-gray-300 rounded"></div>
                                    </div>
                                    <p className="text-xs">QR Code</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Button */}
            <div className="mb-8 w-full px-5 flex justify-center">
                {!isScanning && !scanResult && (
                    <button 
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5 font-medium text-sm"
                        onClick={startScanning}
                    >
                        <ScanLine className="w-4 h-4" /> Scan QR Code
                    </button>
                )}

                {isScanning && (
                    <button
                        className="bg-red-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5 font-medium text-sm"
                        onClick={stopScanning}
                    >
                        Stop Scanning
                    </button>
                )}

                {scanResult && (
                    <button
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5 font-medium text-sm"
                        onClick={resetScan}
                    >
                        <ScanLine className="w-4 h-4" /> Scan Again
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="text-center pb-8 text-gray-600 text-xs px-5">
                <p className="font-semibold text-gray-800">Having trouble or found a bug?</p>
                <p>
                    Tap <span className="text-blue-600 font-semibold">Admin</span> to get quick help — we're here to support you.
                </p>
            </div>

            {/* Result Modal */}
            {scanResult && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-blue-600 text-white py-4 px-6 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold">Hasil Scan QR Code</h2>
                                    <p className="text-sm text-blue-50 mt-1">Informasi detail barang</p>
                                </div>
                                <button
                                    className="text-white hover:text-blue-100 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors"
                                    onClick={() => setScanResult(null)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                            {/* Info Details */}
                            <div className="w-full space-y-3 mb-6">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Nama Barang</span>
                                    <span className="text-sm font-semibold text-gray-900">{scanResult.item_name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Tipe Barang</span>
                                    <span className="text-sm font-semibold text-gray-900">{scanResult.item_type || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Node Asal</span>
                                    <span className="text-sm font-semibold text-gray-900">{scanResult.source_node_name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Node Tujuan</span>
                                    <span className="text-sm font-semibold text-gray-900">{scanResult.dest_node_name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Jumlah Barang</span>
                                    <span className="text-sm font-semibold text-gray-900">{scanResult.item_count || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${
                                        scanResult.status === 'completed' || scanResult.status === 'success' 
                                            ? 'bg-green-100 text-green-700' 
                                            : scanResult.status === 'pending' || scanResult.status === 'in_transit'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : scanResult.status === 'failed' || scanResult.status === 'error'
                                            ? 'bg-red-100 text-red-700'
                                            : 'text-gray-900'
                                    }`}>
                                        {scanResult.status || '-'}
                                    </span>
                                </div>
                                
                                {/* Show raw data if error */}
                                {scanResult.raw && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Error:</p>
                                        <p className="text-xs text-red-800 break-all">{scanResult.raw}</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Close Button */}
                            <button
                                className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-medium text-base hover:bg-blue-800 transition-colors"
                                onClick={() => setScanResult(null)}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Page