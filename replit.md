# replit.md

## Overview
Ekrili is a modern property rental platform for the Tunisian market, focusing on students and families. It offers intelligent search with geolocation, real-time messaging, secure contract management, and flexible pricing. Built as a full-stack web application using React and Express.js, it provides comprehensive property management, user authentication, and integrated communication tools. The project aims to streamline property rentals with advanced features and a user-friendly experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **August 28, 2025**: 🚀 **MAJOR UPDATE: Advanced Social Profile System**
  - **Revolutionary Profile System**: Complete social networking features with public profiles, badge systems, and activity tracking
  - **Smart Badge System**: Intelligent badge awarding based on user behavior, discipline scores, and achievements (Common, Rare, Epic, Legendary)
  - **Discipline & Trust Scoring**: Advanced algorithms for user reputation management (0-100 discipline score, dynamic trust scoring)
  - **Social Activity Tracking**: Comprehensive user activity monitoring with posts, comments, likes, and sharing
  - **Profile Views & Analytics**: Real-time profile view tracking with detailed analytics and visitor insights
  - **Social Media Integration**: Seamless linking to Facebook, Instagram, LinkedIn, Twitter, and personal websites
  - **Achievement System**: 15+ dynamic badges including verification, activity, achievement, and social categories
  - **Public Profile Pages**: Dedicated social profile pages with tabs for posts, activity, and statistics
  - **Enhanced User Experience**: Glass-morphism design with Tunisian cultural elements and responsive layouts
- **August 27, 2025**: Successfully completed migration from Replit Agent to standard Replit environment
- **Security Fixes**: Replaced hardcoded credentials with environment variables for enhanced security
- **Authentication Fixed**: Test users now have email verification enabled (emailVerified: true)
- **Dependencies Updated**: Resolved npm audit vulnerabilities through package updates
- **Email Service Configured**: Gmail SMTP integration with real email delivery capability
- **Migration Verification**: All core functionality tested and working properly

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
- **Email Verification**: Required for new registrations with secure code generation
- **Email Service**: Free Gmail SMTP with nodemailer (console fallback for development)

### UI/UX Design System
- **Design Philosophy**: Neo-brutalism with glassmorphism
- **Color Scheme**: HSL-based with Tunisian cultural influences (warm orange-red primary, Mediterranean blue secondary)
- **Typography**: Modern sans-serif with gradient text effects
- **Components**: Consistent design across all elements

### Key Features
- **Advanced Social Profile System**: 
  - **Public Profiles**: Comprehensive user profiles with social media links, activity feeds, and achievement showcases
  - **Smart Badge System**: Dynamic badge awarding with 4 rarity levels (Common, Rare, Epic, Legendary) across verification, activity, achievement, and social categories
  - **Discipline & Trust Scoring**: Real-time reputation management with discipline scores (0-100) and calculated trust scores
  - **Activity Tracking**: Complete user activity monitoring including posts, profile views, messages, and platform interactions
  - **Social Integration**: Native support for Facebook, Instagram, LinkedIn, Twitter, and personal website links
  - **Performance Analytics**: Detailed user statistics including response rates, satisfaction scores, and growth metrics
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
    - **Enhanced 5-Step Termination Workflow**: 
        1. Demande créée (Request created)
        2. Confirmation propriétaire (Owner password confirmation)
        3. Confirmation locataire (Tenant password confirmation)
        4. Signature propriétaire (Owner digital signature)
        5. Signature locataire (Tenant digital signature)
    - All steps must be completed before contract termination becomes effective.
    - Bilateral termination system supports multiple types: mutual, early_by_owner, early_by_tenant, dispute.
    - Both parties receive "Mes demandes" functionality with real-time updates.
- **Notification System**: User preference-based, multi-channel delivery.
- **Offer Management**:
    - Complete offers page for sent/received offers with status tracking.
    - Tenants can request contracts only after offers are accepted.
    - Prevents duplicate pending offers from tenants.
    - Real-time status updates and notifications for offer lifecycle (creation, acceptance, rejection, contract request).
- **Role-Based UI**: Dynamic interface elements and notifications based on user role (tenant/owner).
- **Page-by-Page Termination Workflow**:
    - Tenant-initiated requests with comprehensive form (reason, details, proposed terms).
    - Owner detailed review page with accept/decline functionality and response capability.
    - Smart navigation system directing users to appropriate workflow pages based on request status.
    - Real-time "Mes demandes" dropdowns for both tenants and owners with 5-second refresh.
    - Complete step-by-step progression through all 5 validation stages with visual indicators.

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