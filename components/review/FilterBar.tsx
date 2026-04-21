"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterBarProps {
  currentStatus?: string;
  currentSort?: string;
}

export default function FilterBar({ currentStatus, currentSort }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [searchParams, pathname, router],
  );

  const handleStatusChange = (status: string | null) => {
    updateFilter("status", status);
  };

  const handleSortChange = (sort: string | null) => {
    updateFilter("sort", sort);
  };

  const isActive = (value: string | null, current?: string) => {
    return value === null ? !current : current === value;
  };

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    marginRight: "8px",
    border: "1px solid #ccc",
    backgroundColor: active ? "#000" : "#fff",
    color: active ? "#fff" : "#000",
    cursor: "pointer",
    borderRadius: "4px",
  });

  return (
    <div style={{ margin: "16px 0" }}>
      <div style={{ marginBottom: "10px" }}>
        <strong>Status: </strong>
        {[
          { label: "All", value: null },
          { label: "Completed", value: "COMPLETED" },
          { label: "Pending", value: "PENDING" },
          { label: "Failed", value: "FAILED" },
        ].map(({ label, value }) => (
          <button
            key={label}
            style={buttonStyle(isActive(value, currentStatus))}
            onClick={() => handleStatusChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <strong>Sort: </strong>
        {[
          { label: "Newest", value: "newest" },
          { label: "Oldest", value: "oldest" },
          { label: "Score", value: "score" },
        ].map(({ label, value }) => (
          <button
            key={label}
            style={buttonStyle(isActive(value, currentSort))}
            onClick={() => handleSortChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
