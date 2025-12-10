'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid2x2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Image from 'next/image';
import adminNodeImage from '@/assets/public/admin_node.png';

interface InventoryItem {
  item_id: string;
  item_name: string;
  item_type: string;
  units: string | null;
  total_count: number;
}

interface Node {
  id: string;
  name: string;
  type: string;
  location?: string;
}

export default function NodeAdminInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [userNode, setUserNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserNodeAndData();
  }, []);

  const fetchUserNodeAndData = async () => {
    setIsLoading(true);
    try {
      const nodeResponse = await fetch('/api/user/node');
      const nodeData = await nodeResponse.json();
      
      if (!nodeData.success) {
        console.error('Error fetching user node:', nodeData.message);
        return;
      }
      
      const userNodeInfo = nodeData.data.node;
      setUserNode(userNodeInfo);
      
      const inventoryResponse = await fetch(`/api/inventory?node_id=${userNodeInfo.id}`);
      const inventoryData = await inventoryResponse.json();
      
      if (inventoryData.success) {
        setInventory(inventoryData.data.inventory || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans pb-24">
      {/* Header */}
      <div 
        className="bg-blue-600 text-white px-4 pt-10 pb-6 rounded-b-3xl shadow-md fixed top-0 left-0 right-0 z-10"
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/node-admin')}
            className="text-white hover:bg-blue-700 rounded-full"
          >
            <ArrowLeft size={24} />
          </Button>
          <Grid2x2 size={28} className="md:w-7 md:h-7 w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-semibold">Inventory Summary</h1>
        </div>
      </div>

      <div className="pt-32 px-4 md:px-5">
        {/* Node Info */}
        <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between shadow-sm mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg">
              {userNode ? `${userNode.name} (${userNode.type})` : 'Loading Node...'}
            </h3>
            <p className="text-gray-600 text-sm md:text-base">Aggregated Inventory View</p>
          </div>
          <Image
            src={adminNodeImage}
            alt="Admin Node"
            width={80}
            height={80}
            className="w-16 md:w-20 flex-shrink-0 ml-2 object-contain"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm md:text-base">Loading...</div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <table className="w-full text-left text-[9px] md:text-sm min-w-[550px]">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-3 py-2 font-medium rounded-tl-lg">Item Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium rounded-tr-lg">Total Count</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                      No inventory found
                    </td>
                  </tr>
                ) : (
                  inventory.map((item, index) => (
                    <tr key={item.item_id} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                      <td className="px-3 py-2 font-medium">{item.item_name}</td>
                      <td className="px-3 py-2">{item.item_type}</td>
                      <td className="px-3 py-2 font-bold">
                        {item.total_count} {item.units || ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
