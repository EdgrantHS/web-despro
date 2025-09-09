## Progress Update Meeting 1 - 2025/09/07

> AI generated based on audio recording, and then manually edited

- *Recording*: https://audio.com/edgrant/audio/despro-meeting-1
- *Attendees*: Gran, Haris, Other participants
- *Topic*: Project Planning and Technical Discussion for Despro Project
- *Summary*: The meeting covered current development progress on QR scanning, front-end and back-end architectural decisions for Next.js, a discussion on necessary hardware (QR scanner, printer), an project timeline split into phases, and strategies for task division and parallel work. Key decisions were made regarding API structure and initial tasks for the first two weeks.

- *Discussion Points*
  - **Current Development Progress & Front-End Aspects**
    - The team reported successful implementation of QR scanning to capture images and convert them to Base64 format.
    - The Base64 string can already be converted into text.
    - A significant challenge remains in converting the Base64 string into JSON format for database upload.
    - There is exploration into finding a method to directly convert QR code scans into JSON, which would be more efficient.
    - The front-end dev is also responsible for building the UI and connecting to APIs.
    - Initial front-end tasks for Phase 1 include developing the login page and the QR scan page.

  - **Back-End Architecture & API Design**
    - The project uses Next.js, where pages are `page.tsx` files and APIs are typically handled via `route.ts` files.
    - A best practice for processing QR code strings is to use a dedicated back-end API route designed to receive the string and handle database operations (e.g., uploading JSON).
    - There was a discussion on whether to create helper functions within a page's API or to establish dedicated API routes with their own URLs for complex logic.
    - The consensus was to create **specific API routes** with URLs for functions like receiving QR strings and processing them, rather than embedding helper functions directly within a page's API handler. This approach allows for external calls and better task division.
    - For a full-stack framework like Next.js, both front-end and back-end can reside in the same repository.
    - Front-end components will call these internal APIs, passing necessary data (e.g., the scanned string).
    - Phase 1 back-end tasks include creating APIs for login (returning node information) and handling the QR scan string (processing, removing/adding items from database).
    - The initial database schema needs to include `item`, `node`, `user`, `transit`, `item type`, and `item instance` tables, which can be hardcoded initially if not fully implemented.
    - An admin dashboard UI is planned for a later phase.

  - **Hardware Requirements & Integration**
    - The possibility of using a phone camera as the "hardware" was discussed, but the preference is for a dedicated physical hardware component.
    - NFC was suggested as an alternative to QR scanning, though experience with it is limited.
    - The team decided to explore acquiring both a **QR scanner** and a **printer** (for QR code generation) to fulfill the hardware requirement.
    - The budget for hardware is IDR 2,000,000, and a method for reimbursement will be established.
    - It's crucial that the hardware can be **controlled and integrated with code** (e.g., through APIs) rather than relying on a separate application.
    - Barcode scanners typically integrate easily by acting as keyboard input, and it needs to be confirmed if QR code scanners function similarly.

  - **Project Scope, Goals & Timeline**
    - The team debated whether to aim for a basic "pass" or a "good" project suitable for a portfolio, ultimately deciding to aim for a **high-quality project**.
    - The project timeline is set for **3 months** (September, October, November), with a workshop in October, leaving 12 weeks for development.
    - **Phase 1 (Week 1-2, by end of September):**
        - Hardcode two nodes and two users for initial testing.
        - Test QR scanning to ensure item modification (remove/add) works.
        - Develop login page and QR scan page (front-end).
        - Create core database tables: `item`, `node`, `user`, `transit`, `item type`, `item instance` (can be hardcoded if necessary).
        - Develop backend APIs for login and handling scan strings.
    - **Phase 2 (Week 3):**
        - Implement QR code generation.
        - Integrate the hardware.
    - **Phase 3:**
        - Implement user and node creation.
        - Develop transit management features.
        - Ensure user login correctly validates against the appropriate node.
    - **Phase 4:**
        - To be planned.
    - The plan aims for project completion by mid-November, followed by reviewing and additional features.

  - **Team Workflow & Task Division**
    - To facilitate parallel work and clear responsibilities, the team decided to **separate front-end UI development from back-end logic**.
    - Front-end developers will focus on UI and calling APIs, while back-end developers will handle the logic and database interactions.
    - Complex processing, like handling QR scan strings and updating multiple tables, will be encapsulated in dedicated API routes.
    - This division ensures that tasks are assigned per file or module, preventing multiple people from working on the same file and simplifying task allocation for reporting purposes.
    - The front-end can proceed with calling internal APIs, assuming they will work, allowing parallel development while the back-end APIs are being developed.

- *Action Items*:
  - PM
    - [ ] Research and find a way to convert Base64 strings to JSON, or directly convert QR code scans to JSON.
    - [ ] Merge existing branches to main and setup phase 1 template repo.
  - Hardware
    - [ ] Search for controllable QR scanner and printer hardware that can be integrated with code.
    - [ ] Verify if QR code scanners (like barcode scanners) act as keyboard input when connected to a computer.
  - FE
    - [ ] Develop the login page (initially with hardcoded users) UI.
    - [ ] Develop the QR scan page UI.
  - BE
    - [ ] Develop an API for login that returns user/node information.
    - [ ] Develop an API to handle the QR scan string, processing it to remove/add items from the database.
    - [ ] Set up / connect / create CRUD API for database tables (`item`, `node`, `user`, `transit`, `item type`, and `item instance` (can be hardcoded initially)).