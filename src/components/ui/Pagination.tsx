import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(searchParams)) {
          if (value) search.set(key, value);
        }
        search.set("page", String(pageNumber));

        return (
          <Link
            key={pageNumber}
            href={`${basePath}?${search.toString()}`}
            className={pageNumber === page ? "font-semibold text-blue-light" : "hover:text-blue-light"}
          >
            {pageNumber}
          </Link>
        );
      })}
    </div>
  );
}
