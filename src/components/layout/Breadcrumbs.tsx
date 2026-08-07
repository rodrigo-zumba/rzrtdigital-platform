"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

type BreadcrumbsProps = {
  /** Raiz do segmento (ex.: "/admin") — não aparece como item, só delimita onde começar. */
  root: string;
  rootLabel: string;
  /** Rótulos amigáveis por segmento de rota (ex.: { clientes: "Clientes" }). */
  labels: Record<string, string>;
};

function isLikelyId(segment: string): boolean {
  return segment.length >= 20 && !/\s/.test(segment);
}

export function Breadcrumbs({ root, rootLabel, labels }: BreadcrumbsProps) {
  const pathname = usePathname();
  const withoutRoot = pathname.startsWith(root) ? pathname.slice(root.length) : pathname;
  const segments = withoutRoot.split("/").filter(Boolean);

  const items = segments.reduce<{ href: string; label: string }[]>((acc, segment) => {
    const href = `${acc.at(-1)?.href ?? root}/${segment}`;
    const label = labels[segment] ?? (isLikelyId(segment) ? "Detalhes" : segment.replace(/-/g, " "));
    return [...acc, { href, label }];
  }, []);

  return (
    <nav aria-label="Trilha de navegação" className="flex min-w-0 items-center gap-1.5 text-sm text-text-secondary">
      <Link href={root} className="shrink-0 hover:text-blue-light">
        {rootLabel}
      </Link>
      {items.map((item, index) => (
        <Fragment key={item.href}>
          <span aria-hidden="true">/</span>
          {index === items.length - 1 ? (
            <span className="truncate text-text-primary" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link href={item.href} className="shrink-0 hover:text-blue-light">
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
