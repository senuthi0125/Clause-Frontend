import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import LandingPage from "./pages/landing-page";
import DashboardPage from "./pages/dashboard-page";
import CalendarPage from "./pages/calendar-page";
import ContractsPage from "./pages/contracts-page";
import ContractTemplatePage from "./pages/contract-template-page";
import CreateContractPage from "./pages/create-contract-page";
import ContractDetailsPage from "./pages/contract-details-page";
import ConflictDetectionPage from "./pages/conflict-detection-page";
import AIAnalysisPage from "./pages/ai-analysis-page";
import RiskAnalysisPage from "./pages/risk-analysis-page";
import AdminOverviewPage from "./pages/admin-overview-page";
import AdminUsersPage from "./pages/admin-users-page";
import AdminAuditPage from "./pages/admin-audit-page";
import AdminApprovalsPage from "./pages/admin-approvals-page";
import AdminNotificationsPage from "./pages/admin-notifications-page";
import WorkflowsPage from "./pages/workflows-page";
import WorkflowDetailPage from "./pages/workflow-detail-page";
import UploadPipelinePage from "./pages/upload-pipeline-page";
import { AuthBridge } from "./components/auth-bridge";
import { ThemeProvider } from "./components/theme-provider";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 px-4 py-8">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/sign-in/*"
            element={
              <AuthLayout>
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  fallbackRedirectUrl="/dashboard"
                />
              </AuthLayout>
            }
          />

          <Route
            path="/sign-up/*"
            element={
              <AuthLayout>
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  fallbackRedirectUrl="/dashboard"
                />
              </AuthLayout>
            }
          />

          <Route
            path="/*"
            element={
              <>
                <SignedIn>
                  <AuthBridge />
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/contracts" element={<ContractsPage />} />
                    <Route path="/upload" element={<UploadPipelinePage />} />
                    <Route path="/contracts/new" element={<ContractTemplatePage />} />
                    <Route path="/contracts/create" element={<CreateContractPage />} />
                    <Route path="/contracts/:id" element={<ContractDetailsPage />} />
                    <Route path="/ai-analysis" element={<AIAnalysisPage />} />
                    <Route path="/conflict-detection" element={<ConflictDetectionPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
                    <Route path="/workflows" element={<WorkflowsPage />} />
                    <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
                    <Route path="/admin" element={<AdminOverviewPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
                    <Route path="/admin/audit" element={<AdminAuditPage />} />
                    <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                    <Route path="/admin/workflows" element={<WorkflowsPage />} />
                    <Route path="/admin/workflows/:id" element={<WorkflowDetailPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </SignedIn>

                <SignedOut>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </SignedOut>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}