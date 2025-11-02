import { NextRequest } from 'next/server';
import { createErrorResponse } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const qrId = params.id;
  
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code Placeholder</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          border-radius: 10px;
          padding: 30px;
          max-width: 400px;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .warning {
          color: #ff6b6b;
          font-size: 18px;
          margin-bottom: 20px;
        }
        .qr-id {
          font-family: monospace;
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ QR Code Placeholder</h1>
        <p class="warning">This is a placeholder QR code URL generated due to QR creation failure.</p>
        <p>QR ID: <span class="qr-id">${qrId}</span></p>
        <p>Please contact the system administrator to resolve QR code generation issues.</p>
      </div>
    </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}