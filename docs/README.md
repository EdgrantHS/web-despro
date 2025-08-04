```mermaid
graph
  %% Define actors/users
  Users[Users]

  %% Define user devices
  subgraph UserDevices[User Devices Phone/PC\)]
    PC[PC/Laptop]
    Phone[Smartphone]
    QRScanner[Dedicated QR Scanner]
    QRPrinter[QR Code Printer]
  end

  %% Define client application
  subgraph ClientApp[Client Application]
    WebApp[WebApp Next.js]
    subgraph QRCode[QR Code Generation]
      direction LR
      QRCodeGen[QR Code Generator]
      QRCodeGen2[QR Code Generator2]
      QRCodeGen3[QR Code Generator3]
    end
  end

  %% Define Supabase services
  subgraph Supabase[Backend as a Service - Supabase]
    Auth[Authentication]
    API[Application Logic/API Routes]
    DB[(PostgreSQL Database)]
    Realtime[Realtime Service]
  end

  %% User to device connections
  AdminPusat -.-> PC
  AdminNode -.-> PC
  Users -.-> Phone
  Users -.-> PC
  QRScanner -.-> PC
  Users -.-> QRScanner

  %% Device to app connections
  PC -.-> WebApp
  Phone -.-> WebApp

  %% App to Supabase connections
  WebApp -.-> Auth
  WebApp -.-> API
  API -.-> DB
  DB -.-> Realtime
  Realtime -.-> WebApp

  %% Other
  API -.-> QRPrinter
```
