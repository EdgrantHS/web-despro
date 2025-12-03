'use client'
import { assets } from '@/assets/public/assets';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import petugasImage from '@/assets/public/01_image_petugas.png';

const QRCodeCreate = () => {
    const router = useRouter();
    // State untuk data dropdown hasil fetch
    // tambahkan 'count' pada tipe item instance
    const [itemInstanceList, setItemInstanceList] = useState<{ id: string; name: string; count: number }[]>([]);
    const [sourceList, setSourceList] = useState<{ id: string; name: string; type: string; address: string }[]>([]);
    const [destinationList, setDestinationList] = useState<{ id: string; name: string; type: string; address: string }[]>([]);

    // State untuk form
    const [formData, setFormData] = useState({
        itemInstanceId: '',
        sourceId: '',
        destinationId: '',
        itemCount: 0
    });

    // State data untuk kebutuhan frontend
    const [modalOpen, setModalOpen] = useState(false);
    const [qrData, setQrData] = useState<{
        qr_url: string;
        item_name: string;
        item_type: string;
        item_count: number;
        source_name: string;
        destination_name: string;
    } | null>(null);

    // Handler fetch data (siapkan, tinggal isi logic fetch)
    useEffect(() => {
        fetchSourceNodes();
        fetchDistributionNodes();

        // console.log('QR Data:', qrData);

    }, []);

    useEffect(() => {
        fetchItemInstances();
    }, [formData.sourceId])


    // Fetch item instances dari API
    const fetchItemInstances = async () => {
        try {
            const response = await fetch(`/api/item-instances?node_id=${formData.sourceId}`);
            const result = await response.json();
            // Pastikan response sukses dan ada data
            if (result.success && result.data && Array.isArray(result.data.item_instances)) {
                setItemInstanceList(
                    result.data.item_instances.map((item: any) => ({
                        id: item.id,
                        name: item.item_types?.item_name || item.item_type?.item_name || "Unknown",
                        count: item.item_count || 0
                    }))
                );
            } else {
                setItemInstanceList([]);
            }
        } catch (err) {
            console.error("Failed to fetch item instances:", err);
            setItemInstanceList([]);
        }
    };

    // Fetch asal (source nodes) - now allows any node as source
    const fetchSourceNodes = async () => {
        try {
            const response = await fetch('/api/nodes?status=active');
            const result = await response.json();

            if (result.success && result.data && Array.isArray(result.data.nodes)) {
                setSourceList(
                    result.data.nodes.map((node: any) => ({
                        id: node.id, // Use 'id' since we fixed the field mapping
                        name: node.name, // Use 'name' since we fixed the field mapping
                        type: node.type, // Use 'type' since we fixed the field mapping
                        address: node.location || "" // Use 'location' since we fixed the field mapping
                    }))
                );
            } else {
                setSourceList([]);
            }
        } catch (err) {
            console.error("Failed to fetch source nodes:", err);
            setSourceList([]);
        }
    };

    // Fetch tujuan (destination nodes) - now allows all active nodes as destination
    const fetchDistributionNodes = async () => {
        try {
            const response = await fetch('/api/nodes?status=active');
            const result = await response.json();

            if (result.success && result.data && Array.isArray(result.data.nodes)) {
                setDestinationList(
                    result.data.nodes.map((node: any) => ({
                        id: node.id, // Use 'id' since we fixed the field mapping
                        name: node.name, // Use 'name' since we fixed the field mapping
                        type: node.type, // Use 'type' since we fixed the field mapping
                        address: node.location || "" // Use 'location' since we fixed the field mapping
                    }))
                );
            }
        } catch (err) {
            console.error("Failed to fetch destination nodes:", err);
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

        // Parsing form data ke format API
        const parsedData = {
            item_instance_id: formData.itemInstanceId,
            source_id: formData.sourceId,
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
                    sourceId: '',
                    destinationId: '',
                    itemCount: 0
                });
            } else {
                console.error('Failed to create new QR Code: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error creating QR code:', err);
        }
    };

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

                {/* Asal */}
                <div>
                    <label className="text-sm font-semibold text-gray-700">Asal</label>
                    <div className="relative mt-1">
                        <select
                            name="sourceId"
                            value={formData.sourceId}
                            onChange={handleChange}
                            className="w-full appearance-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Pilih Asal</option>
                            {sourceList.map(node => (
                                <option key={node.id} value={node.id}>
                                    {node.name} ({node.type})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
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

            { /* Popup Modal QR Code */}
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
                            {/* QR Code */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center justify-center border border-gray-200">
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
    );
};

export default QRCodeCreate;