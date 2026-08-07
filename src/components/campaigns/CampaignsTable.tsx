"use client";

import type { Campaign } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { DataTable } from "@/components/tables/DataTable";

const PLATFORM_LABEL: Record<string, string> = {
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
  TIKTOK_ADS: "TikTok Ads",
  LINKEDIN_ADS: "LinkedIn Ads",
  OUTRO: "Outro",
};

export function CampaignsTable({ campaigns, basePath }: { campaigns: Campaign[]; basePath: string }) {
  const columns: ColumnDef<Campaign, unknown>[] = [
    {
      accessorKey: "name",
      header: "Campanha",
      cell: ({ row }) => (
        <Link href={`${basePath}/${row.original.id}`} className="font-medium text-text-primary hover:text-blue-light">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "platform", header: "Canal", cell: ({ row }) => PLATFORM_LABEL[row.original.platform] },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <CampaignStatusBadge status={row.original.status} /> },
  ];

  return <DataTable columns={columns} data={campaigns} emptyMessage="Nenhuma campanha cadastrada ainda." />;
}
