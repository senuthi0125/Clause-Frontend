import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Contract, Workflow } from "../types/api";

type WorkflowItem = {
  workflow: Workflow;
  contract?: Contract;
};

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export default function WorkflowsPage() {
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const contractsData = await api.listContracts("?per_page=100");
      const workflowContracts = contractsData.contracts.filter(
        (contract) => !!contract.workflow_id
      );

      const workflowResults = await Promise.all(
        workflowContracts.map(async (contract) => {
          try {
            const workflow = await api.getWorkflow(contract.workflow_id as string);
            return { workflow, contract };
          } catch {
            return null;
          }
        })
      );

      const validItems: WorkflowItem[] = [];
      for (const item of workflowResults) {
        if (item) {
          validItems.push(item);
        }
      }

      setItems(validItems);
    } catch {
      setError("Failed to load workflows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    items.forEach((item) => {
      const type = item.contract?.contract_type || "other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [items]);

  return (
    <AppShell
      title="Workflows"
      subtitle="Track workflow progress for contracts connected to the backend."
      contractGroups={contractGroups}
      actions={
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Loading workflows...</p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500">
          No workflows found. Create a contract first.
        </p>
      )}

      <div className="grid gap-4">
        {items.map(({ workflow, contract }) => (
          <Card
            key={workflow.id}
            className="border border-slate-200 bg-white shadow-sm"
          >
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{workflow.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {contract?.title || "Unlinked contract"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge className="bg-slate-100 text-slate-700">
                    {formatLabel(workflow.status)}
                  </Badge>
                  <Badge className="bg-violet-100 text-violet-700">
                    Step {workflow.current_step}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div>
                  <span className="font-medium text-slate-900">
                    Contract type:
                  </span>{" "}
                  {contract ? formatLabel(contract.contract_type) : "—"}
                </div>

                <div>
                  <span className="font-medium text-slate-900">Total steps:</span>{" "}
                  {workflow.steps ? workflow.steps.length : 0}
                </div>

                <div>
                  <span className="font-medium text-slate-900">Updated:</span>{" "}
                  {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button asChild>
                  <Link to={`/workflows/${workflow.id}`}>Open workflow</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}