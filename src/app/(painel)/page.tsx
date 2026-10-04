import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Can } from "@/components/shared/can";
import { PageHeader } from "@/components/shared/page-header";
import { ManagementDashboard } from "@/features/dashboard/components/management-dashboard";
import { OperationalDashboard } from "@/features/dashboard/components/operational-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Can permission="relatorios:view" fallback={<OperationalDashboard />}>
        <ManagementDashboard />
      </Can>
    </>
  );
}
