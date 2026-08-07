"use client";

import type { Project } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { DataTable } from "@/components/tables/DataTable";

export function ProjectsTable({ projects, basePath }: { projects: Project[]; basePath: string }) {
  const columns: ColumnDef<Project, unknown>[] = [
    {
      accessorKey: "name",
      header: "Projeto",
      cell: ({ row }) => (
        <Link href={`${basePath}/${row.original.id}`} className="font-medium text-text-primary hover:text-blue-light">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "progress",
      header: "Progresso",
      cell: ({ row }) => `${row.original.progress}%`,
    },
    {
      accessorKey: "dueDate",
      header: "Prazo",
      cell: ({ row }) =>
        row.original.dueDate ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(row.original.dueDate) : "—",
    },
  ];

  return <DataTable columns={columns} data={projects} emptyMessage="Nenhum projeto cadastrado ainda." />;
}
