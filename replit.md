# replit.md

## Overview
Ekrili is a modern property rental platform for the Tunisian market, focusing on students and families. It offers intelligent search with geolocation, real-time messaging, secure contract management, and flexible pricing. Built as a full-stack web application using React and Express.js, it provides comprehensive property management, user authentication, and integrated communication tools. The project aims to streamline property rentals with advanced features and a user-friendly experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript (SPA)
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom glassmorphism and Tunisian-inspired palette
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Architecture**: RESTful API with modular routes
- **Storage**: Abstracted storage layer (in-memory for development)
- **Development**: Hot module replacement with Vite integration

### Database
- **ORM**: Drizzle ORM for type-safe operations
- **Schema Management**: Centralized definitions in `/shared`
- **Validation**: Zod for runtime type validation
- **Migration System**: Drizzle Kit

### Authentication & Authorization
- **Client-side**: localStorage-based session management
- **User Types**: Role-based (tenants, property owners)
- **Profile Management**: Comprehensive user profiles with verification

### UI/UX Design System
- **Design Philosophy**: Neo-brutalism with glassmorphism
- **Color Scheme**: HSL-based with Tunisian cultural influences (warm orange-red primary, Mediterranean blue secondary)
- **Typography**: Modern sans-serif with gradient text effects
- **Components**: Consistent design across all elements

### Key Features
- **Property Management**: CRUD operations, image upload, amenities, availability.
- **Search System**: Advanced filtering by geolocation, price, category.
- **Messaging**: Real-time chat with history and file sharing.
- **Contract Management**:
    - French legal contract creation with CIN fields, electronic signatures (owner then tenant).
    - Full lifecycle from creation to activation with real-time notifications.
    - 3-day expiration if tenant doesn't sign.
    - Properties switch status (Disponible/Loué) based on contract activity.
    - Modification capability with signature reset.
    - Secure PDF generation for signed contracts.
    - Prevents multiple active contracts for same property.
    - Hourly background job for expiring contracts.
    - Owners create contracts only after tenant requests.
    - Modification/termination requests by owners require tenant approval.
- **Notification System**: User preference-based, multi-channel delivery.
- **Offer Management**:
    - Complete offers page for sent/received offers with status tracking.
    - Tenants can request contracts only after offers are accepted.
    - Prevents duplicate pending offers from tenants.
    - Real-time status updates and notifications for offer lifecycle (creation, acceptance, rejection, contract request).
- **Role-Based UI**: Dynamic interface elements and notifications based on user role (tenant/owner).

## External Dependencies
### Core Frameworks
- **React Ecosystem**: React 18, React DOM, Wouter
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Hookform Resolvers

### UI & Styling
- **Radix UI**: Accessible UI primitives
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority

### Database & Backend
- **Database**: PostgreSQL with Neon Database serverless driver
- **ORM**: Drizzle ORM with Drizzle Kit
- **Validation**: Zod, Drizzle-Zod
- **Session Management**: connect-pg-simple (PostgreSQL session storage)

### Development Tools
- **Build System**: Vite (with React plugin)
- **Language Support**: TypeScript
- **Date Handling**: date-fns

### Specialized Features
- **Carousel**: Embla Carousel React
- **Command Interface**: cmdk
- **Digital Signatures**: React Signature Canvas
- **Utilities**: nanoid