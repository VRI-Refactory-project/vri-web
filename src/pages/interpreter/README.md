# SignConnect interpreter functionality — repository addition

These files implement the interpreter-facing functionality represented by the
supplied UI references:

1. Interpreter dashboard
2. Available request queue
3. Request details / accept / decline
4. Weekly availability and exceptions
5. Verification success/failure result screens
6. Interpreter sidebar/navigation
7. API adapter for the backend endpoints

## Where to add them

```text
frontend/
└── src/
    ├── components/
    │   └── interpreter/
    │       └── InterpreterSidebar.jsx
    ├── pages/
    │   └── interpreter/
    │       ├── InterpreterLayout.jsx
    │       ├── InterpreterDashboard.jsx
    │       ├── InterpreterRequests.jsx
    │       ├── InterpreterRequestDetails.jsx
    │       ├── InterpreterAvailability.jsx
    │       ├── VerificationResult.jsx
    │       ├── interpreter.css
    │       ├── interpreterRoutes.jsx
    │       └── README.md
    └── services/
        └── interpreterApi.js
```

Use the repository's existing SignConnect logo at:

```text
src/assets/signconnect-logo.png
```

No new asset is required by these screens.

## Backend connection

The UI/API boundary is isolated in `src/services/interpreterApi.js`.

Expected endpoints, based on the existing VRI functionality, are:

- GET `/api/interpreter/dashboard/`
- GET `/api/interpreter/requests/`
- GET `/api/interpreter/requests/:id/`
- POST `/api/interpreter/requests/:id/accept/`
- POST `/api/interpreter/requests/:id/decline/`
- GET `/api/interpreter/availability/`
- PUT `/api/interpreter/availability/`
- PATCH `/api/interpreter/status/`

If the existing Django API uses different endpoint names, edit only this
adapter rather than changing the page components.

## Important

The supplied screenshots show the intended UI states. The frontend cannot
invent the final backend contract. Therefore the API adapter is deliberately
isolated so the backend team can connect the actual endpoints without
rewriting the screens.

The availability page currently persists its demo state to localStorage until
the real API is connected. Request accept/decline is represented immediately
in the UI and should be replaced/confirmed by `interpreterApi.acceptRequest`
and `interpreterApi.declineRequest` when the backend is wired.

## Suggested commit

```bash
git add src/components/interpreter/InterpreterSidebar.jsx
git add src/pages/interpreter/
git add src/services/interpreterApi.js
git commit -m "feat(interpreter): add dashboard request routing and availability screens"
```
