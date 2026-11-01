"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export function CustomerSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/customers?${qs}` : `/customers`);
      });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 h-9 text-sm w-full sm:w-56">
      <Search className="w-4 h-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-transparent outline-none flex-1"
        placeholder="Tìm tên, mã, địa chỉ..."
      />
      {value && (
        <button
          type="button"
          aria-label="Xóa tìm kiếm"
          onClick={() => setValue("")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
