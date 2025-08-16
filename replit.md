# Overview

TweetBot AI is a comprehensive automated Twitter/X account management platform built with React and Express. The application enables users to generate AI-powered content, schedule tweets, track analytics, and grow their Twitter presence through intelligent automation. It features a secure multi-tenant architecture with Replit authentication, allowing multiple users to safely connect and manage their Twitter accounts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript running on Vite
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OpenID Connect with session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Content Generation**: OpenAI GPT-4o integration for tweet creation
- **Scheduling**: Node-cron for automated tweet posting
- **Twitter Integration**: Twitter API v2 for posting and account management

## Database Design
- **Users**: Profile information and authentication data
- **Twitter Accounts**: Connected social media accounts with OAuth tokens
- **Content Topics**: Predefined and custom content categories
- **Tweets**: Generated content with scheduling and status tracking
- **Analytics**: Performance metrics and engagement data
- **Sessions**: Secure session management for authenticated users

## Key Features Architecture
- **AI Content Generation**: Topic-based tweet creation with style and length customization
- **Smart Scheduling**: Automated posting with timezone handling and optimal timing
- **Multi-Account Support**: Users can manage multiple Twitter accounts
- **Content Queue Management**: Draft, approve, and schedule tweet workflows
- **Performance Tracking**: Engagement metrics and growth analytics

## Security Considerations
- **Token Management**: Encrypted storage of Twitter OAuth tokens with refresh capability
- **Session Security**: HTTP-only cookies with CSRF protection
- **Input Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Built-in protection for external API calls

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migrations and schema management

## AI and Content Services
- **OpenAI API**: GPT-4o model for intelligent tweet generation
- **Twitter API v2**: Social media posting and account data retrieval

## Authentication and Security
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware and strategy management

## Utility Services
- **Node-cron**: Scheduled task execution for automated posting
- **Date-fns**: Date manipulation and timezone handling
- **Memoizee**: Function result caching for performance optimization

## Development Tools
- **TypeScript**: Type safety across the full stack
- **ESBuild**: Fast production bundling
- **Vite**: Development server with hot module replacement