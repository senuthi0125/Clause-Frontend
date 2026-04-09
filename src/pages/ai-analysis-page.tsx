import { useEffect, useMemo, useState } from "react";
import { Bot, Send, Sparkles, Wand2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Contract } from "@/types/api";

type Tab = "chat" | "analyze" | "generate";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export default function AIAnalysisPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatContractId, setChatContractId] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [analyzeText, setAnalyzeText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [draftType, setDraftType] = useState("nda");
  const [draftParties, setDraftParties] = useState(`Party A\nParty B`);
  const [draftTerms, setDraftTerms] = useState(
    `duration: 12 months\npayment: Net 30`
  );
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listContracts("?per_page=100")
      .then((data) => setContracts(data.contracts))
      .catch(() => {});
  }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    contracts.forEach((contract) => {
      counts.set(
        contract.contract_type,
        (counts.get(contract.contract_type) || 0) + 1
      );
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [contracts]);

  const sendChat = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.chat(chatQuestion, chatContractId || undefined);
      setChatAnswer(data.answer);
    } catch {
      setError("Chat failed");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.analyzeText(analyzeText);
      setAnalysisResult(data);
    } catch {
      setError("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async () => {
    setLoading(true);
    setError(null);

    try {
      const parties = draftParties
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name }));

      const keyTerms = Object.fromEntries(
        draftTerms
          .split("\n")
          .map((line) => line.split(":"))
          .filter((parts) => parts.length >= 2)
          .map(([key, ...rest]) => [key.trim(), rest.join(":").trim()])
      );

      const data = await api.generateDraft({
        contract_type: draftType,
        parties,
        key_terms: keyTerms,
      });

      setGeneratedDraft(data.content || "");
    } catch {
      setError("Draft generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="AI Analysis"
      subtitle="Use AI tools for contract chat, analysis, and draft generation."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === "chat" ? "default" : "outline"}
          onClick={() => setTab("chat")}
        >
          <Send className="mr-2 h-4 w-4" />
          Chat
        </Button>
        <Button
          variant={tab === "analyze" ? "default" : "outline"}
          onClick={() => setTab("analyze")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze
        </Button>
        <Button
          variant={tab === "generate" ? "default" : "outline"}
          onClick={() => setTab("generate")}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Generate
        </Button>
      </div>

      {tab === "chat" && (
        <Card>
          <CardHeader>
            <CardTitle>Ask the AI assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={chatContractId}
              onChange={(e) => setChatContractId(e.target.value)}
            >
              <option value="">General question</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.title}
                </option>
              ))}
            </select>

            <Input
              placeholder="Ask question"
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
            />

            <Button onClick={sendChat} disabled={loading || !chatQuestion.trim()}>
              <Bot className="mr-2 h-4 w-4" />
              Send
            </Button>

            {chatAnswer && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {chatAnswer}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "analyze" && (
        <Card>
          <CardHeader>
            <CardTitle>Analyze Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-40 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
              value={analyzeText}
              onChange={(e) => setAnalyzeText(e.target.value)}
              placeholder="Paste contract text here"
            />

            <Button onClick={runAnalysis} disabled={loading || !analyzeText.trim()}>
              Analyze
            </Button>

            {analysisResult && (
              <div className="space-y-4">
                {analysisResult.summary && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">
                        {analysisResult.summary}
                      </p>
                      {analysisResult.risk_level && (
                        <Badge className="bg-slate-100 text-slate-700">
                          {formatLabel(analysisResult.risk_level)}
                        </Badge>
                      )}
                    </div>
                    {analysisResult.risk_score != null && (
                      <p className="mt-2 text-sm text-slate-500">
                        Risk score: {analysisResult.risk_score}
                      </p>
                    )}
                  </div>
                )}

                {analysisResult.extracted_clauses?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="mb-2 font-medium text-slate-900">
                      Extracted clauses
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {analysisResult.extracted_clauses.map(
                        (clause: string, index: number) => (
                          <li key={index}>{clause}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {analysisResult.recommendations?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="mb-2 font-medium text-slate-900">
                      Recommendations
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {analysisResult.recommendations.map(
                        (item: string, index: number) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {!analysisResult.summary &&
                  !analysisResult.extracted_clauses?.length &&
                  !analysisResult.recommendations?.length && (
                    <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {JSON.stringify(analysisResult, null, 2)}
                    </pre>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "generate" && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
            >
              <option value="service_agreement">Service Agreement</option>
              <option value="nda">NDA</option>
              <option value="employment">Employment</option>
              <option value="vendor">Vendor</option>
              <option value="licensing">Licensing</option>
              <option value="partnership">Partnership</option>
            </select>

            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
              value={draftParties}
              onChange={(e) => setDraftParties(e.target.value)}
              placeholder="One party per line"
            />

            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
              value={draftTerms}
              onChange={(e) => setDraftTerms(e.target.value)}
              placeholder="key: value"
            />

            <Button onClick={generateDraft} disabled={loading}>
              Generate
            </Button>

            {generatedDraft && (
              <textarea
                className="min-h-72 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
                value={generatedDraft}
                readOnly
              />
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}