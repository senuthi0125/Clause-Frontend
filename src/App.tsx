import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/dashboard-page";
import CalendarPage from "./pages/calendar-page";
import ContractsPage from "./pages/contracts-page";
import ContractTemplatePage from "./pages/contract-template-page";
import CreateContractPage from "./pages/create-contract-page";
import ConflictDetectionPage from "./pages/conflict-detection-page";
import AIAnalysisPage from "./pages/ai-analysis-page";
import WorkflowsPage from "./pages/workflows-page";
import WorkflowDetailPage from "./pages/workflow-detail-page";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/new" element={<ContractTemplatePage />} />
        <Route path="/contracts/create" element={<CreateContractPage />} />
        <Route path="/ai-analysis" element={<AIAnalysisPage />} />
        <Route path="/conflict-detection" element={<ConflictDetectionPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;