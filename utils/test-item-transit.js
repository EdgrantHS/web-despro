// Test script for item transit creation
// Run this in browser console or Node.js to test the API

async function testItemTransitCreation() {
  const testData = {
    item_instance_id: "f2b9d90e-3899-4fb3-8757-c06d6baf851b", // Replace with actual ID
    source_node_id: "a3ecea28-507e-45c4-a20a-42ef81cc0042",   // Replace with actual ID
    dest_node_id: "dd024ed1-3593-486f-bc69-bba8929c9f6d",     // Replace with actual ID
    time_departure: new Date().toISOString(),
    courier_name: "Test Courier",
    courier_phone: "123456789"
  };

  try {
    console.log('Testing item transit creation with data:', testData);
    
    const response = await fetch('/api/item-transit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ Item transit created successfully!');
      console.log('QR URL:', result.data?.qr_url);
    } else {
      console.error('❌ Item transit creation failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

// Uncomment to run the test
// testItemTransitCreation();

export { testItemTransitCreation };