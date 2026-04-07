import { useMemo } from "react";
import { CalendarDays, Clock3, Bell, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const upcomingItems = [
  {
    title: "Vendor Agreement Renewal",
    date: "2026-04-12",
    time: "10:00 AM",
    type: "Renewal",
    status: "Upcoming",
  },
  {
    title: "NDA Review Meeting",
    date: "2026-04-15",
    time: "2:30 PM",
    type: "Review",
    status: "Scheduled",
  },
  {
    title: "Employment Contract Expiry",
    date: "2026-04-20",
    time: "11:00 AM",
    type: "Expiry",
    status: "Attention",
  },
  {
    title: "Service Agreement Approval Deadline",
    date: "2026-04-24",
    time: "4:00 PM",
    type: "Approval",
    status: "Pending",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function badgeClass(value: string) {
  switch (value.toLowerCase()) {
    case "upcoming":
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "attention":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function CalendarPage() {
  const contractGroups = useMemo(
    () => [
      { name: "Renewals", count: 1 },
      { name: "Reviews", count: 1 },
      { name: "Expiries", count: 1 },
      { name: "Approvals", count: 1 },
    ],
    []
  );

  return (
    <AppShell
      title="Calendar"
      subtitle="Track important contract dates, renewals, reviews, and deadlines."
      contractGroups={contractGroups}
      actions={
        <Button variant="outline" disabled>
          Google Calendar integration next
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-slate-700" />
              <CardTitle>Contract Calendar Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                Calendar UI placeholder
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                This page is ready in your frontend structure. You can later connect
                it to Google Calendar or backend reminders.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-700" />
                  <p className="text-sm font-medium text-slate-900">Reminders</p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">4</p>
                <p className="mt-1 text-xs text-slate-500">
                  Upcoming important events
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-700" />
                  <p className="text-sm font-medium text-slate-900">This Week</p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">2</p>
                <p className="mt-1 text-xs text-slate-500">
                  Scheduled reviews or deadlines
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-700" />
                  <p className="text-sm font-medium text-slate-900">Expiring Soon</p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">1</p>
                <p className="mt-1 text-xs text-slate-500">
                  Contracts needing action
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingItems.map((item) => (
                <div
                  key={`${item.title}-${item.date}`}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(item.date)} · {item.time}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{item.type}</p>
                    </div>
                    <Badge className={badgeClass(item.status)}>{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}