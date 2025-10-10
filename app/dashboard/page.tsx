import { Suspense } from "react";
import DashboardContent from "@/components/dashboard-content";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}