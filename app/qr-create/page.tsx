'use client'
import { assets } from '@/assets/public/assets';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import petugasImage from '@/assets/public/01_image_petugas.png';
import * as QRCodeLib from 'qrcode';

const QRCodeCreate = () => {
    const router = useRouter();
    // State untuk data dropdown hasil fetch
    const [itemInstanceList, setItemInstanceList] = useState<{ id: string; name: string; count: number }[]>([]);
    const [destinationList, setDestinationList] = useState<{ id: string; name: string; type: string; address: string }[]>([]);
    const [userNode, setUserNode] = useState<{ id: string; name: string; type: string; location?: string } | null>(null);

    // State untuk form
    const [formData, setFormData] = useState({
        itemInstanceId: '',
        destinationId: '',
        itemCount: 0
    });

    // State data untuk kebutuhan frontend
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [qrData, setQrData] = useState<{
        qr_url: string;
        item_name: string;
        item_type: string;
        item_count: number;
        source_name: string;
        destination_name: string;
    } | null>(null);

    // Handler fetch data
    useEffect(() => {
        fetchUserNodeAndData();
    }, []);

    const fetchUserNodeAndData = async () => {
        setIsLoading(true);
        try {
            // First, get the user's assigned node
            const nodeResponse = await fetch('/api/user/node');
            const nodeData = await nodeResponse.json();
            
            if (!nodeData.success) {
                console.error('Error fetching user node:', nodeData.message);
                return;
            }
            
            const userNodeInfo = nodeData.data.node;
            setUserNode(userNodeInfo);
            
            // Now fetch item instances for this specific node and destination nodes
            const [instancesRes, destinationRes] = await Promise.all([
                fetch(`/api/item-instances?node_id=${userNodeInfo.id}`),
                fetch('/api/nodes?status=active')
            ]);
            
            const [instancesData, destinationData] = await Promise.all([
                instancesRes.json(),
                destinationRes.json()
            ]);
            
            if (instancesData.success && instancesData.data && Array.isArray(instancesData.data.item_instances)) {
                setItemInstanceList(
                    instancesData.data.item_instances.map((item: any) => ({
                        id: item.id,
                        name: item.item_types?.item_name || item.item_type?.item_name || "Unknown",
                        count: item.item_count || 0
                    }))
                );
            } else {
                setItemInstanceList([]);
            }

            if (destinationData.success && destinationData.data && Array.isArray(destinationData.data.nodes)) {
                setDestinationList(
                    destinationData.data.nodes.map((node: any) => ({
                        id: node.id,
                        name: node.name,
                        type: node.type,
                        address: node.location || ""
                    }))
                );
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'itemCount') {
            // number input -> parse int, limit handled by input attributes
            setFormData(prev => ({ ...prev, itemCount: Number(value) }));
            return;
        }

        if (name === 'itemInstanceId') {
            // when selecting an item, set default itemCount = 1 (if available)
            const selectedId = value;
            const selected = itemInstanceList.find(i => i.id === selectedId);
            const defaultCount = selected && selected.count > 0 ? 1 : 0;
            setFormData(prev => ({ ...prev, itemInstanceId: selectedId, itemCount: defaultCount }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Function to save QR code as image
    const saveQRAsImage = () => {
        if (!qrData?.qr_url) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 300;
        canvas.width = size;
        canvas.height = size;
        
        // Create QR code using QRCode library
        QRCodeLib.toCanvas(canvas, qrData.qr_url, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error: any) => {
            if (error) {
                console.error('Error generating QR code:', error);
                return;
            }
            
            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
                if (!blob) return;
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `QR-${qrData.item_name}-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        });
    };

    // Function to copy QR code image to clipboard
    const copyQRToClipboard = async () => {
        if (!qrData?.qr_url) return;
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const size = 300;
            canvas.width = size;
            canvas.height = size;
            
            await new Promise((resolve, reject) => {
                QRCodeLib.toCanvas(canvas, qrData.qr_url, {
                    width: size,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, (error: any) => {
                    if (error) reject(error);
                    else resolve(true);
                });
            });
            
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
            }, 'image/png');
        } catch (error) {
            console.error('Error copying QR code:', error);
            // Fallback: copy URL to clipboard
            try {
                await navigator.clipboard.writeText(qrData.qr_url);
                alert('QR URL copied to clipboard!');
            } catch (clipboardError) {
                console.error('Clipboard access failed:', clipboardError);
                alert('Copy failed. Please copy the URL manually.');
            }
        }
    };

    const handleSubmit = async () => {
        // Validasi jumlah sebelum submit
        const selected = itemInstanceList.find(i => i.id === formData.itemInstanceId);
        const max = selected ? selected.count : 0;
        if (!formData.itemInstanceId) {
            console.error('Pilih item terlebih dahulu');
            return;
        }
        if (formData.itemCount < 1 || formData.itemCount > max) {
            alert('Jumlah tidak valid, melebihi stok atau kurang dari 1');
            return;
        }

        if (!userNode) {
            alert('Node information not available');
            return;
        }

        // Parsing form data ke format API
        const parsedData = {
            item_instance_id: formData.itemInstanceId,
            source_id: userNode.id, // Automatically use user's node
            destination_id: formData.destinationId,
            item_count: formData.itemCount
        };
        console.log('Data to submit:', parsedData);

        try {
            const res = await fetch('/api/qr/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedData)
            })

            const result = await res.json();
            if (result.success) {
                console.log('QR code created!');
                console.log('Response Data: ', result.data);
                setQrData({
                    qr_url: result.data.qr_url,
                    item_name: result.data.item_instance?.name || result.data.item_instance?.item_name || "-",
                    item_type: result.data.item_instance?.type || result.data.item_instance?.item_type || "-",
                    // gunakan nilai yang dikembalikan API jika ada, kalau tidak fallback ke parsedData.item_count
                    item_count: result.data.item_instance?.count ?? parsedData.item_count,
                    source_name: result.data.source_node?.name,
                    destination_name: result.data.destination_node?.name
                });
                setModalOpen(true);
                // Reset input form
                setFormData({
                    itemInstanceId: '',
                    destinationId: '',
                    itemCount: 0
                });
            } else {
                console.error('Failed to create new QR Code: ' + (result.message || 'Unknown error'));
                alert('Failed to create QR Code: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error creating QR code:', err);
            alert('Error creating QR code. Please try again.');
        }
    };

    const getUserNodeName = () => {
        return userNode ? `${userNode.name} (${userNode.type})` : 'Loading...';
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-white flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Loading your node information...</p>
                </div>
            </div>
        );
    }

    if (!userNode) {
        return (
            <div className="w-full min-h-screen bg-white flex-1 flex items-center justify-center p-4">
                <div className="max-w-md mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">QR Code Create</h1>
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200 shadow-sm">
                        <p className="text-red-700 mb-4">
                            Unable to load your assigned node. Please contact an administrator.
                        </p>
                        <p className="text-red-600 text-sm">
                            Your user account does not have a node assigned or the node information could not be retrieved.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex justify-center bg-white font-sans">
            <div className="w-full max-w-md bg-white min-h-screen flex flex-col sm:border-2 border-blue-600">
                {/* Header */}
                <div className="bg-blue-600 text-white py-4 px-3 rounded-b-3xl flex items-center gap-2.5">
                    <button onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-base font-semibold">Qr Code Create</h1>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center">
                {/* Illustration */}
                <div className="mt-6 flex justify-center">
                    <Image
                        src={petugasImage}
                        alt="Illustration"
                        width={160}
                        height={160}
                        className="w-40 h-40 object-contain"
                    />
                </div>

                {/* Form */}
                <form className="w-full px-6 mt-4 flex flex-col gap-3 max-w-md" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {/* Nama Barang */}
                <div>
                    <label className="text-sm font-semibold text-gray-700">Nama Barang</label>
                    <div className="relative mt-1">
                        <select
                            name="itemInstanceId"
                            value={formData.itemInstanceId}
                            onChange={handleChange}
                            className="w-full appearance-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {
                                itemInstanceList.length === 0 ? (
                                    <option disabled value="">-- Tidak ada barang tersedia di node yang dipilih --</option>
                                ) : (
                                    <option value="">-- Pilih Barang --</option>
                                )
                            }
                            {itemInstanceList.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} {item.count ? `(${item.count})` : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Jumlah Barang */}
                <div>
                    <label className="text-sm font-semibold text-gray-700">Jumlah Barang</label>
                    <input
                        type="number"
                        name="itemCount"
                        value={formData.itemCount || ''}
                        onChange={handleChange}
                        placeholder="10"
                        min={1}
                        max={(() => {
                            const sel = itemInstanceList.find(i => i.id === formData.itemInstanceId);
                            return sel ? sel.count : 1;
                        })()}
                        className="w-full mt-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={!formData.itemInstanceId}
                    />
                    {(() => {
                        const sel = itemInstanceList.find(i => i.id === formData.itemInstanceId);
                        if (!formData.itemInstanceId) {
                            return <p className="text-xs text-gray-500 mt-1">Pilih barang untuk melihat stok</p>;
                        }
                        const max = sel ? sel.count : 0;
                        if (formData.itemCount > max || formData.itemCount < 1) {
                            return <p className="text-xs text-red-600 mt-1">Maks: {max} — jumlah melebihi stok</p>;
                        }
                        return <p className="text-xs text-gray-500 mt-1">Maks: {max}</p>;
                    })()}
                </div>

                {/* Source Node (Auto-selected and disabled) */}
                <div>
                    <label className="text-sm font-semibold text-gray-700">
                        Source Node (Your Node)
                    </label>
                    <input
                        type="text"
                        value={getUserNodeName()}
                        disabled
                        className="w-full px-3 py-2.5 mt-1 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed opacity-60"
                    />
                    <p className="text-xs text-gray-500 mt-1">Automatically assigned based on your user account</p>
                </div>

                {/* Tujuan */}
                <div>
                    <label className="text-sm font-semibold text-gray-700">Tujuan</label>
                    <div className="relative mt-1">
                        <select
                            name="destinationId"
                            value={formData.destinationId}
                            onChange={handleChange}
                            className="w-full appearance-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Pilih Tujuan</option>
                            {destinationList.map(node => (
                                <option key={node.id} value={node.id}>
                                    {node.name} ({node.type})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>
            </form>

                {/* Create Button */}
                <button 
                    onClick={handleSubmit}
                    className="mt-8 bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium text-base hover:bg-blue-800 transition-colors"
                >
                    Create
                </button>

                {/* Footer */}
                <div className="text-center pb-8 text-gray-600 text-xs px-5 mt-8">
                    <p className="font-semibold text-gray-800">Having trouble or found a bug?</p>
                    <p>
                        Tap <span className="text-blue-600 font-semibold">Admin</span> to get quick help — we're here to support you.
                    </p>
                </div>
            </div>

            {/* Popup Modal QR Code */}
            {modalOpen && qrData && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto">
                        {/* Header */}
                        <div className="bg-blue-600 text-white py-4 px-6 rounded-t-2xl">
                            <h2 className="text-xl font-bold">QR Code Berhasil Dibuat!</h2>
                            <p className="text-sm text-blue-50 mt-1">Scan QR di bawah untuk proses selanjutnya.</p>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                            {/* Save and Copy Buttons */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={saveQRAsImage}
                                    className="flex-1 border-2 border-blue-500 hover:bg-blue-500 hover:text-white text-blue-700 py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                                >
                                    Save Image
                                </button>
                                <button
                                    onClick={copyQRToClipboard}
                                    className="flex-1 border-2 border-blue-500 hover:bg-blue-500 hover:text-white text-blue-700 py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                                >
                                    Copy Image
                                </button>
                            </div>
                            {/* QR Code */}
                            <div className="bg-white rounded-xl p-4 mb-6 flex items-center justify-center border border-gray-200">
                                {qrData.qr_url ? (
                                    <QRCode
                                        value={qrData.qr_url}
                                        size={160}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="M"
                                    />
                                ) : (
                                    <span className="text-orange-700">QR tidak tersedia</span>
                                )}
                            </div>
                            
                            {/* Info Details */}
                            <div className="w-full space-y-3 mb-6">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Nama Barang</span>
                                    <span className="text-sm font-semibold text-gray-900">{qrData.item_name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Tipe Barang</span>
                                    <span className="text-sm font-semibold text-gray-900">{qrData.item_type}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Jumlah Barang</span>
                                    <span className="text-sm font-semibold text-gray-900">{qrData.item_count}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Node Asal</span>
                                    <span className="text-sm font-semibold text-gray-900">{qrData.source_name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Node Tujuan</span>
                                    <span className="text-sm font-semibold text-gray-900">{qrData.destination_name}</span>
                                </div>
                            </div>
                            
                            {/* Close Button */}
                            <button
                                className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-medium text-base hover:bg-blue-800 transition-colors"
                                onClick={() => setModalOpen(false)}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default QRCodeCreate;