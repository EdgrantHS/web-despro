'use client'
import { assets } from '@/assets/public/assets'
import Image from 'next/image'
import React, { useRef, useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { parse } from 'path'

const qrRegionId = "qr-reader-region"

interface ScanResult {
    item_name?: string;
    item_type?: string;
    source_node_name?: string;
    dest_node_name?: string;
    status?: string;
    [key: string]: any;
}

const Page = () => {
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
            if (result.success && result.data) {
                setScanResult({
                    item_name: result.data.item_instance?.item_name,
                    item_type: result.data.item_instance?.item_type,
                    source_node_name: result.data.source_node?.name,
                    dest_node_name: result.data.destination_node?.name,
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
        <div className=''>
            {/* Content */}
            <div className='flex-1 flex flex-col justify-between items-center gap-20 px-6 py-32 relative'>

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
                        <div className="p-6 pb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">QRScan Result</h2>
                                <button
                                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                    onClick={() => setScanResult(null)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="px-6 space-y-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Item Name</span>
                                <span className="text-gray-800 font-medium">{scanResult.item_name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Item Type</span>
                                <span className="text-gray-800 font-medium">{scanResult.item_type || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Source Node</span>
                                <span className="text-gray-800 font-medium">{scanResult.source_node_name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Destination Node</span>
                                <span className="text-gray-800 font-medium">{scanResult.dest_node_name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Status</span>
                                <span className="text-gray-800 font-medium">{scanResult.status || '-'}</span>
                            </div>
                            {/* Show raw data if error */}
                            {scanResult.raw && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Info:</p>
                                    <p className="text-xs text-gray-800 break-all">{scanResult.raw}</p>
                                </div>
                            )}
                        </div>
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