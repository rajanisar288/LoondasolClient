# WorkivLab Frontend Architecture & Developer Guide

## 1. Overview & Principles

The frontend is built with **Angular 19** using:

- **Standalone Components** (`standalone: true`)
- **Modern Reactivity**: Angular Signals (`signal()`, `computed()`, `effect()`) paired with RxJS for async event streams.
- **OnPush Change Detection** strategy across all domain and shared components.
- **Strict Typing**: Zero `any` usage.
- **Design System Fidelity**: Exact reproduction of Cobalt Blue (`#2A65F6`), rounded 8px inputs, translucent active sidebar pills, badges, and split-screen onboarding matching the application design specs.

## 2. Directory Structure

```text
client/src/
├── app/
│   ├── app.config.ts           // HTTP interceptors, router config, animations
│   ├── app.routes.ts           // Root route map with lazy loading
│   ├── app.component.ts        // Root application shell
│   ├── core/                   // Singleton infrastructural services
│   │   ├── auth/               // AuthService, TokenService, AuthGuard, RoleGuard
│   │   ├── http/               // ApiClient, RegionInterceptor, ErrorInterceptor
│   │   ├── socket/             // WebSocketService (synced with JWT)
│   │   └── theme/              // ThemeService (light #2A65F6 / dark mode)
│   ├── shared/                 // Reusable UI library
│   │   ├── components/         // Button, Input, Select, Modal, Drawer, Table, Badge
│   │   ├── directives/         // HasPermissionDirective, ClickOutsideDirective
│   │   └── pipes/              // TimezonePipe, CurrencyFormatPipe
│   ├── layout/                 // Application shell
│   │   ├── sidebar/            // Cobalt Blue #2A65F6 sidebar with pills & badges
│   │   ├── header/             // Search bar, notifications, quick actions
│   │   └── main-layout/        // Responsive layout container
│   └── features/               // Domain feature modules
│       ├── auth/               // Login, Multi-step Onboarding (Steps 1-6)
│       ├── dashboard/          // Executive KPI & activity widgets
│       ├── employees/          // Directory, profiles, invitations
│       ├── departments/        // Department hierarchy
│       ├── attendance/         // Clock-in/out, logs, shift tracking
│       ├── leave/              // Leave applications, balance, approval
│       ├── tasks/              // Kanban boards, task lists
│       ├── chat/               // Real-time channels & direct messaging
│       ├── meetings/           // Video conference & calendar
│       ├── email-campaigns/    // Marketing & notification emails
│       ├── reports/            // AI-driven summaries & analytics
│       ├── subscriptions/      // Free trial, Pro, Ultra, Stripe billing
│       └── settings/           // Company hours, timezone, working days, roles
├── assets/                     // Static images and branding
└── styles.scss                 // Design tokens, #2A65F6, and global components
```

## 3. UI Design System & Component Guidelines

### 3.1 Primary Brand Tokens

- **Brand Primary**: `#2A65F6`
- **Brand Primary Hover**: `#1E54D8`
- **Sidebar Background**: `#2A65F6`
- **Sidebar Active Pill**: `rgba(255, 255, 255, 0.16)`
- **Border Radius**: `8px` (`rounded-lg`)
- **Input Borders**: `#E2E8F0` with focus ring `rgba(42, 101, 246, 0.15)`

### 3.2 Form Input Styling (Screenshot 2 Spec)

All form inputs adhere to the clean minimal style:

```html
<label class="form-label">Company Email *</label>
<input type="email" class="input-control" placeholder="name@company.com" />
```

For reactive forms, bind standard `formControlName` and handle error states through `.input-control.error`.

### 3.3 Sidebar Layout (Screenshot 1 Spec)

The sidebar renders:

1. **Workspace Header**: Rounded card with store domain and dropdown chevron.
2. **Navigation Items**: Pill links with Lucide icons and translucent notification counters (`5`, `10`, `8`).
3. **Active State**: Translucent pill (`rgba(255, 255, 255, 0.16)`) with bold white text.
4. **Bottom Dock**: Inbox item with badge count (`2`) and user profile card (avatar, name, email, collapse button).

## 4. Authentication, Routing & Authorization

### 4.1 Token Handling

- Access token stored in memory or secure storage.
- Auto-refresh mechanism triggered on HTTP 401 via `ErrorInterceptor`.
- When refreshed, WebSocket connection re-authenticates seamlessly.

### 4.2 Permission System

Use the `HasPermissionDirective` to declaratively toggle UX elements:

```html
<button *hasPermission="'employees.create'" class="primary-btn">Invite Employee</button>
```

_Note_: Client-side hiding is for UX only. All backend APIs strictly enforce permissions.

## 5. Adding New Features

1. **Components**: Create inside `features/<domain>/components/` using standalone syntax.
2. **Services**: Create inside `features/<domain>/services/` injecting `ApiClient`.
3. **Routes**: Add lazy-loaded child route in `app.routes.ts` protected with `AuthGuard`.
