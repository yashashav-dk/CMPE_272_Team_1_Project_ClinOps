# ClinOps - Clinical Trial Operations Platform

ClinOps is an AI-powered platform designed to streamline clinical trial operations, from protocol design to regulatory submission. It provides intelligent automation, real-time insights, and built-in compliance features.

## Team Members

| Name | SJSU ID |
|------|---------|
| Pranav Jitendra Trivedi | 019089512 |
| Mohit Manoj Barade | 019130137 |
| Yashashav Devalapalli Kamalraj | 017856371 |
| Anupama Singh | 191042305 |

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm (v9 or later)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd clin-ops
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables (if required). Copy `.env.example` to `.env.local` and fill in the values.
    *(Note: For this submission, the app is configured to run with default settings if no `.env` is provided, using mock or local services where applicable.)*

### Running the Application

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

-   **AI-Powered Chat**: Context-aware AI assistant for generating trial content.
-   **Dashboard**: Visual dashboard for tracking trial progress and widgets.
-   **Smart Send**: Automatically generate structured dashboard widgets from chat content.
-   **Project Management**: Create and manage multiple clinical trial projects.
-   **Guest Access**: Try the platform without creating an account.

## Technologies Used

-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Database**: Prisma (SQLite for local dev)
-   **AI Integration**: Google Gemini / OpenAI (configurable)
-   **Testing**: Jest & React Testing Library
64: 
65: ## Testing & Performance
66: 
67: ### Test Coverage
68: The project maintains a robust test suite with **167 passing tests** across 23 test suites, covering:
69: -   **Unit Tests**: For individual components and utility functions.
70: -   **Integration Tests**: Verifying API routes and service interactions.
71: -   **UI Tests**: Ensuring correct rendering and user interactions for widgets and dashboards.
72: 
73: To run the tests:
74: ```bash
75: npm test
76: ```
77: 
78: ### Performance Optimizations
79: -   **Server-Side Rendering (SSR)**: Leverages Next.js App Router for faster initial page loads and SEO.
80: -   **Code Splitting**: Automatic route-based code splitting to reduce bundle size.
81: -   **Memoization**: Strategic use of `useMemo` and `useCallback` in complex interactive components (e.g., `InteractiveChecklist`) to prevent unnecessary re-renders.
82: -   **Observability**: Integrated `TelemetryProvider` for monitoring application performance and user interactions.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
