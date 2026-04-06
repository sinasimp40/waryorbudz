# Cannabis Marketplace

## Overview

This is the WarriorBudz cannabis marketplace for selling flower, edibles, extracts, mushrooms, and vape products. The application features a dark, cyberpunk-inspired aesthetic with cryptocurrency payment integration. It includes both a customer-facing storefront and an admin panel for product management. The shop name, logo, and branding are fully customizable through the admin panel. Checkout requires a shipping address for physical delivery.

## User Preferences

Preferred communication style: Simple, everyday language.

### Product Data Source
- **Categories**: Flower - A, AA, AAA+, AAAA+, THC Waxpens, Extracts / Hash, Edibles, Mushrooms, Tobacco / Nicotine vapes
- **Console Logging**: Response body logging (:: [...]) is disabled in server logs for cleaner output
- **Seed Endpoint**: POST `/api/admin/seed-products` (admin-protected) seeds sample cannabis products
- **Physical Store**: No digital stock codes; stock is a manual number decremented on purchase

### Email Template
- **Default Template**: Order Confirmation email template with dark theme (black background, theme accents)
- **Template Variables**: {{orderId}}, {{productName}}, {{quantity}}, {{payAmount}}, {{payCurrency}}, {{email}}, {{shopName}}
- **Design**: Physical shipping messaging — "Your order is being prepared for shipment"

### Checkout Flow
- **Shipping Address**: Full shipping address (name, address, city, province, postal code, country) collected at checkout
- **Server Validation**: Shipping fields validated server-side before payment creation
- **Orders Table**: Includes shippingName, shippingAddress, shippingCity, shippingProvince, shippingPostalCode, shippingCountry fields
- **Success Modal**: Shows "Your Order is on the Way!" with shipping address confirmation
- **Stock Management**: Stock is a manual number; decremented by order quantity on payment completion (quantity-aware)

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing (home page and admin panel)
- **State Management**: TanStack React Query for server state management with custom query client configuration
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Theme**: Dark mode by default with light/dark toggle support, using CSS custom properties for theming
- **Theme Customization**: Admin-configurable primary color theme with 10 presets and custom HSL sliders
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives
- **Dynamic Metadata**: Page title, meta description, and favicon update dynamically from admin settings

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON API endpoints under `/api/*` prefix
- **WebSocket**: Real-time payment status updates using the `ws` library
- **Build Process**: Custom build script using esbuild for server bundling and Vite for client

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Current Storage**: In-memory storage implementation (`MemStorage`) with interface designed for database migration
- **Database Config**: Drizzle Kit configured for PostgreSQL with migrations output to `./migrations`

### Payment Integration
- **Provider**: Cryptocurrency payment gateway
- **Supported Currencies**: BTC, ETH, LTC, USDT, DOGE, XMR, XRP, BNB, SOL
- **Payment Flow**: Modal-driven checkout with real-time WebSocket status updates
- **IPN Handling**: Webhook support for payment confirmation with signature verification

### Product Variants
- **Parent-Child Model**: Products can be grouped as variants using `parentId` field (e.g., "14 Days" and "1 Month" of same product)
- **Storefront**: Child products hidden from main listing; parent card shows "from $X" with combined stock; modal shows variant selector buttons
- **Admin**: GitBranch icon to link/unlink variants; shows variant count and parent relationships in product table
- **API**: POST `/api/products/:id/variants` (link), DELETE `/api/products/:id/variants/:childId` (unlink)
- **Types**: `ProductWithVariants = Product & { variants?: Product[] }` in shared schema

### Tracking History
- **Table**: `tracking_history` — id, orderId, trackingNumber, previousTrackingNumber, editedBy, editedAt
- **Verification**: Manual payment orders (E-Transfer/Shakepay) require a tracking number to verify
- **Edit History**: Every tracking number add/update is logged with previous value, editor email, and timestamp
- **Admin UI**: Edit tracking (pencil icon), view history (history icon) per order in admin table
- **User Dashboard**: Tracking number displayed as Canada Post link; "History" button opens tracking change log
- **Email Notifications**: Distinct emails for new tracking vs. updated tracking (different colors/wording)
- **Canada Post URL**: `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={trackingNumber}`
- **Access Control**: User tracking endpoint requires auth + ownership check; admin history endpoint requires admin role

### Key Design Patterns
- **Shared Types**: Common schema types shared between client and server via `@shared/*` path alias
- **Modal-Driven UX**: Product details and payment flows use modal dialogs for seamless experience
- **Category Filtering**: Products organized by categories (FLIGHTS, HOTELS, SHOPPING, GIFTCARDS, etc.)
- **Country Support**: Products can be associated with multiple countries using flag-based UI

### Status Page
- **Route**: `/status` accessible from navbar
- **Services Monitored**: Application Server, Payment Gateway (NOWPayments), Database, Email (SMTP), WebSocket connections
- **Real-time Updates**: WebSocket at `/ws/status` broadcasts status every 30 seconds
- **API**: `GET /api/status` returns all service statuses with overall health
- **Visual**: Green/amber/red status indicators with overall health banner

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components including admin panel
│       ├── pages/        # Route page components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities and providers
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data storage interface
│   └── nowpayments.ts # Payment service integration
├── shared/           # Shared code between client/server
│   └── schema.ts     # Database schema and types
└── migrations/       # Drizzle database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (via DATABASE_URL environment variable)
- **Drizzle ORM**: Database access layer with Zod schema validation

### Payment Processing
- **Crypto Gateway API**: Cryptocurrency payment processing
- **Environment Variables**: Requires API key and IPN secret for payment processing

### Email Service
- **Provider**: SMTP via Nodemailer (configurable in admin panel)
- **Settings**: SMTP Host, Port, Secure (SSL/TLS), Username, Password, From Email, From Name
- **Storage**: SMTP settings stored in database settings table (smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, smtp_from_email, smtp_from_name)
- **API Endpoints**: GET/POST /api/settings/smtp, POST /api/settings/smtp/test
- **Admin UI**: SMTP Settings section in Admin Panel Settings tab

### Database Backup System
- **Export/Import**: Full database export to JSON, import from backup files
- **Progress Tracking**: Real-time WebSocket progress updates with 1% granularity
- **Telegram Integration**: Send backups directly to Telegram chat via bot
- **Encryption**: Telegram bot tokens encrypted using AES-256-GCM with persistent encryption key
- **Scheduled Backups**: Configurable auto-backup intervals (hourly, daily, weekly, monthly)
- **API Endpoints**: POST /api/admin/database/export, POST /api/admin/database/import, POST /api/admin/database/send-telegram
- **Security**: All database backup routes protected with requireAdmin middleware
- **Service Files**: server/services/databaseBackupService.ts, server/services/telegramService.ts

### Security (server/security.ts)
- **Helmet**: Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- **Rate Limiting**: Global (200 req/15min), API (60 req/min), Auth (15 req/15min), Payment (5 req/min)
- **Brute Force Protection**: IP-based tracking - 5 failed logins = 2min block, 10 failed = 15min block
- **Request Filtering**: Blocks SQL injection patterns, path traversal, XSS attempts, common attack paths
- **HPP**: HTTP Parameter Pollution protection
- **Server Identity**: X-Powered-By and Server headers removed
- **Packages**: helmet, express-rate-limit, hpp, cors

### Frontend Libraries
- **React Day Picker**: Calendar component
- **Embla Carousel**: Carousel functionality
- **React Hook Form**: Form management with Zod resolver
- **Lucide React**: Icon library
- **React Icons**: Additional icons (crypto currency symbols)

### Development Tools
- **Vite**: Development server (HMR disabled in middleware mode for Replit compatibility) with production bundling
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment

## Replit Environment Notes

- **Dev script**: Uses `npx tsx` instead of bare `tsx` to resolve local node_modules binary
- **Vite HMR**: Disabled (`hmr: false`) in Vite middleware mode to prevent WebSocket conflicts with the app's `ws` WebSocket servers
- **Port**: App binds on `0.0.0.0:5000`, exposed externally via Replit proxy on port 80
- **Rate Limiting**: Global rate limiter skips `/`, `/src/*`, `/@*`, `.js`, `.css`, `/assets` paths to prevent blocking page loads
- **WebSockets**: App uses path-based WebSocket servers (`/ws/products`, `/ws/theme`, etc.) via the `ws` library attached to the Express HTTP server
