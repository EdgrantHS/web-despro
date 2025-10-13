'use client'
import { assets } from '@/assets/public/assets';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import React, { useEffect, useState } from 'react';

const QRCodeCreate = () => {
    // State untuk data dropdown hasil fetch
    // tambahkan 'count' pada tipe item instance
    const [itemInstanceList, setItemInstanceList] = useState<{ id: string; name: string; count: number }[]>([]);
    const [sourceList, setSourceList] = useState<{ id: string; name: string; type: string; address: string }[]>([]);
    const [destinationList, setDestinationList] = useState<{ id: string; name: string }[]>([]);

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

    // Fetch asal (source nodes)
    const fetchSourceNodes = async () => {
        try {
            const response = await fetch('/api/nodes?node_type=Source&status=active');
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
            }
        } catch (err) {
            console.error("Failed to fetch source nodes:", err);
        }
    };

    // Fetch tujuan (distribution nodes)
    const fetchDistributionNodes = async () => {
        try {
            const response = await fetch('/api/nodes?node_type=Distribution&status=active');
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
            console.error("Failed to fetch distribution nodes:", err);
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
        <div className="w-full min-h-screen bg-white flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col gap-20">
                {/* Header with Icon */}
                <div className="flex flex-col items-center mb-8">
                    <Image src={assets.create_icon} className='w-20 h-20 flex items-center justify-center mb-4' alt="Create QR Code" />
                    <h1 className="text-2xl font-bold text-black">QR Code Create</h1>
                </div>

                {/* Form */}
                <div className="space-y-5">
                    {/* Asal */}
                    <div>
                        <label className="block text-sm font-medium text-black mb-2">
                            Asal (Node)
                        </label>
                        <select
                            name="sourceId"
                            value={formData.sourceId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white cursor-pointer"
                        >
                            <option value="">Pilih Asal</option>
                            {sourceList.map(node => (
                                <option key={node.id} value={node.id}>
                                    {node.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ID Barang */}
                    <div>
                        <label className="block text-sm font-medium text-black mb-2">
                            Nama Barang
                        </label>
                        <select
                            name="itemInstanceId"
                            value={formData.itemInstanceId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white cursor-pointer"
                        >
                            {
                                itemInstanceList.length === 0 ?
                                (
                                    <option disabled>-- Tidak ada barang tersedia di node yang dipilih --</option>
                                ) :
                                <option value="">-- Pilih Barang-- </option>
                            }
                            {itemInstanceList.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} {item.count ? `(${item.count})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Jumlah Barang (number input, max dari selected item count) */}
                    <div>
                        <label className="block text-sm font-medium text-black mb-2">
                            Jumlah Barang
                        </label>
                        <input
                            type="number"
                            name="itemCount"
                            value={formData.itemCount}
                            onChange={handleChange}
                            min={1}
                            max={ (() => {
                                const sel = itemInstanceList.find(i => i.id === formData.itemInstanceId);
                                return sel ? sel.count : 1;
                            })() }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                            disabled={!formData.itemInstanceId}
                        />
                        {/* VALIDATION MESSAGE: show normal helper or warning if over max */}
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

                    {/* Tujuan */}
                    <div>
                        <label className="block text-sm font-medium text-black mb-2">
                            Tujuan (Node)
                        </label>
                        <select
                            name="destinationId"
                            value={formData.destinationId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white cursor-pointer"
                        >
                            <option value="">Pilih Tujuan</option>
                            {destinationList.map(node => (
                                <option key={node.id} value={node.id}>
                                    {node.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Create Button */}
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={handleSubmit}
                        className="px-12 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                        CREATE
                    </button>
                </div>
            </div>

            { /* Popup Modal QR Code */}
            {modalOpen && qrData && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto p-6">
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-bold text-black mb-2">QR Code Berhasil Dibuat!</h2>
                            <p className="text-gray-700 mb-4 text-center">Scan QR di bawah untuk proses selanjutnya.</p>
                            <div className="bg-gray-100 rounded-xl p-4 mb-4 flex items-center justify-center">
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
                            <div className="w-full space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Nama Barang</span>
                                    <span className="font-medium text-black">{qrData.item_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tipe Barang</span>
                                    <span className="font-medium text-black">{qrData.item_type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Jumlah Barang</span>
                                    <span className="font-medium text-black">{qrData.item_count}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Node Asal</span>
                                    <span className="font-medium text-black">{qrData.source_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Node Tujuan</span>
                                    <span className="font-medium text-black">{qrData.destination_name}</span>
                                </div>
                            </div>
                            <button
                                className="w-full bg-black text-white py-2 rounded-lg font-medium mt-2"
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