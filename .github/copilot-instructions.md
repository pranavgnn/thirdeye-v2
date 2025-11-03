You are working on a traffic violation management system for India named ThirdEye.

Tech Stack:

- React Router v7 Framework
- Shadcn UI components
- Tailwind CSS
- TypeScript
- Node.js
- PostgreSQL
- pnpm as the package manager

Naming Conventions:

- Use camelCase for variable and function names.
- Use PascalCase for component and class names.
- Use UPPER_SNAKE_CASE for constants.
- Use kebab-case for file and folder names.

Routing Conventions:

- Every route is a folder inside the `app/routes` directory.
- Every route folder contains an `index.tsx` file that serves as the main entry point for that route.
- For nested routes, create subfolders within the parent route folder.
- If a route has page-specific components, create a `components` subfolder for components specific to that route.
- If a route requires hard-coded styles, create a `styles.css.ts` file for route-specific styles.
- If a route requires data mutations or form submissions, create an `index.actions.ts` file for route-specific actions.
- If a route requires data loading, create an `index.loader.ts` file for route-specific data loading.
- If a route requires utility functions, create a `utils.ts` file within the route folder.
- Everytime you add a route, make sure to update the `app/routes.ts` file to include the new route.

UI Conventions:

- No hard-coded colors, use Shadcn UI variables so that themes can be applied easily.
- Extensively use the shadcn UI component library for building UI components.
- Try to make reusable components as much as possible, eg. navbar.
- Follow responsive design principles using Tailwind CSS utility classes.
- Use Flexbox and CSS Grid for layout designs.
- Ensure accessibility standards (ARIA) are followed in all UI components.

API Conventions:

- API routes are defined in the `app/api` directory.
- Each API route is a folder containing an `index.ts` file that handles the request.
- Versioning is important, create subfolders for different API versions (e.g., `v1`, `v2`).
- Use RESTful principles for designing API endpoints.
- Use appropriate HTTP methods (GET, POST, PUT, DELETE) for different operations.
- Enforce input validation and sanitization for all API endpoints.
- Enforce rate limiting and authentication for sensitive API endpoints.

Component Structure:

- A component can be of two types: common and page-specific.
- Common components are reusable across multiple features and are stored in the `app/components` directory.
- Page-specific components are stored within their respective route folders.

Database Conventions:

- Use parameterized queries to prevent SQL injection.
- Use snake_case for database table and column names.

Error Handling:

- Implement centralized error handling middleware for API routes.
- Define standard error response formats and use them consistently across the application.

Testing Conventions:

- Write unit tests for utility functions and components.
- Write integration tests for API routes and database interactions.
- Follow a consistent naming convention for test files, either `.test.ts` or `.spec.ts`.

Instructions for GitHub Copilot:

- **VERY STRICTLY** follow all the conventions mentioned above.
- Always ensure that the code adheres to best practices for security, performance, and maintainability.
- Write clean, readable, and self-documenting code - which means you will not add comments unless absolutely necessary.
- Assume the dev server is always running. You do not have to worry about starting the dev server, building the project, or restarting the server.
