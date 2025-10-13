# Project Roadmap and Milestones

This document outlines the high-level roadmap and key milestones for the project. It serves as a guide to track progress and ensure timely completion of deliverables.

## Table of Contents

- [Project Roadmap and Milestones](#project-roadmap-and-milestones)
  - [Table of Contents](#table-of-contents)
  - [Roadmap Overview](#roadmap-overview)
    - [Phase 1 (Weeks 1-2): Scanning \& Basic Inventory Management](#phase-1-weeks-1-2-scanning--basic-inventory-management)
    - [Phase 2 (Week 3): QR code generation](#phase-2-week-3-qr-code-generation)
    - [Phase 3 (Weeks 4-5): User Roles, Node, and transit Management](#phase-3-weeks-4-5-user-roles-node-and-transit-management)
    - [Phase 4 (Weeks 6-7): Reporting, recipe, and cooking features](#phase-4-weeks-6-7-reporting-recipe-and-cooking-features)
    - [Phase 5 (Weeks 8-9): Final Polish, Testing \& Deployment](#phase-5-weeks-8-9-final-polish-testing--deployment)
    - [Phase 6: Workshop Preparation](#phase-6-workshop-preparation)

## Roadmap Overview

The project will be displayed at a workshop on mid December 2025. The following milestones are planned to ensure the project will be completed in November so that there is time to prepare for the workshop.

---

### Phase 1 (Weeks 1-2): Scanning & Basic Inventory Management

- **Timeline:** 8 September 2025 - 21 September 2025
- **Milestone:** QR scanning is available. 
  - Hard code QR codes for some items for testing
  - Hard code 2 nodes (can be seperated by route)
  - If node A scans item, item will be removed from node A's inventory and be in transit
  - If node B scans item, item will be added to node B's inventory and removed from transit
- **Tasks:**  
  - **PM:** Oversee architecture, and code structure.
  - **FE:** Build and connect UI for public scanning, integrate QR code scanner library.
    - Login page
    - QR Scan Page 
  - **BE:** Integrate pre-defined Supabase schema. Create public API for scanning.
    - Login API: Accepts: username and password; Return: node and user priviledge
    - QR Scan API: Accepts: username (tentative); Return: modify transit and item_instance table


### Phase 2 (Week 3): QR code generation

- **Timeline:** 22 September **2025** - 28 September 2025
- **Milestone:** QR codes can be generated for new items.
  - Admin can create new items, and generate QR codes for them.
  - QR codes can be printed and attached to physical items.
- **Tasks:**
  - **FE:** Build UI for item creation and QR code generation.
  - **BE:** Create API for item creation and QR code generation.
  - **Hardware:** Integrate with QR code printers or normal printers.

### Phase 3 (Weeks 4-5): User Roles, Node, and transit Management

- **Timeline:** 6 October 2025 - 19 October 2025
- **Milestone:** User authentication and role-based access control implemented
  - Core roles: "Admin Pusat", "Admin Node", "Petugas Node"
  - "Admin Node" can manage users for their node
  - "Petugas Node" can only scan items
  - Created management dashboard for "Admin Node" to view and manage inventory, transit, and users
  - Created management dashboard for "Admin Pusat" to view and manage nodes
  - User are automatically assigned to a node, when the open the QR scanning page, they can only scan for their node
- **Tasks:**
  - **FE:** Build and connect UI for authentication and management dashboard (inventory, transit, users, nodes)
  - **BE:** Create CRUD API for inventory, transit, users, and nodes.
  - **Hardware:** Integrate with QR code scanners.

### Phase 4 (Weeks 6-7): Reporting, recipe, and cooking features

- **Timeline:** 20 October 2025 - 2 November 2025
- **Milestone:** Discrepancy reporting enabled. "Assembly Node" can create recipes. Petugas can "cook" a recipe, correctly adjusting inventory.
  - Reports can be created when discrepancies are found during stocktaking.
  - Petugas "Assembly Node" can create recipes and need admin approval to be saved globally.
  - Petugas can "cook" a recipe, which will deduct the ingredients from inventory and add the product to inventory.
- **Tasks:**
  - **PM:** End to end testing of all features,
  - **FE:** Build UI for discrepancy reporting, recipe creation, and the "Cook" feature.
  - **BE:** Create CRUD API for reports, recipes, and cooking process.

### Phase 5 (Weeks 8-9): Final Polish, Testing & Deployment

- **Timeline:** 3 November 2025 - 16 November 2025
- **Milestone:** Feature-complete, tested, and deployed application on Vercel.
- **Tasks:**
  - **PM:** Conduct final review and oversee deployment.
  - **FE:** Refine UI/UX on all pages.
  - **BE:** Review security vulnerabilities and optimize performance.

### Phase 6: Workshop Preparation

- **Milestone:** Prepare for workshop presentation and demo.
- **Tasks:**
  - Formulate presentation plan.
  - Create presentation materials.
  - Perpare materials for demo.

