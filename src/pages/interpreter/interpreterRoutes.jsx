/*
 * Route addition for the existing React Router configuration.
 *
 * Import these components in the repository's current router file and merge
 * these routes into the existing <Routes>. Do NOT create a second BrowserRouter.
 *
 * import InterpreterLayout from "./pages/interpreter/InterpreterLayout";
 * import InterpreterDashboard from "./pages/interpreter/InterpreterDashboard";
 * import InterpreterRequests from "./pages/interpreter/InterpreterRequests";
 * import InterpreterRequestDetails from "./pages/interpreter/InterpreterRequestDetails";
 * import InterpreterAvailability from "./pages/interpreter/InterpreterAvailability";
 * import VerificationResult from "./pages/interpreter/VerificationResult";
 *
 * <Route path="/interpreter" element={<InterpreterLayout />}>
 *   <Route path="dashboard" element={<InterpreterDashboard />} />
 *   <Route path="requests" element={<InterpreterRequests />} />
 *   <Route path="requests/:id" element={<InterpreterRequestDetails />} />
 *   <Route path="availability" element={<InterpreterAvailability />} />
 * </Route>
 *
 * <Route path="/verification" element={<VerificationResult />} />
 *
 * If authentication guards already exist, wrap /interpreter with the existing
 * authenticated-role guard and allow only verified interpreters.
 */
