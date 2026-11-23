"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams as useNextSearchParams, useParams as useNextParams } from "next/navigation";

export function useNavigate() {
  const router = useRouter();
  return (to: string | number) => {
    if (typeof to === "number") {
      if (typeof window !== "undefined") {
        if (to === -1) window.history.back();
        else if (to === 1) window.history.forward();
      }
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname() || "";
  const searchParams = useNextSearchParams();
  return {
    pathname,
    search: searchParams?.toString() ? `?${searchParams.toString()}` : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
  };
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = React.useCallback(
    (newParams: Record<string, string> | URLSearchParams) => {
      const sp = new URLSearchParams(newParams.toString());
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname]
  );

  return [searchParams, setSearchParams] as const;
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>() {
  return (useNextParams() || {}) as T;
}

export function NavLink({
  to,
  className,
  children,
  ...props
}: any) {
  const pathname = usePathname();
  const isActive = pathname === to || (to !== "/" && pathname?.startsWith(to));
  const computedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link href={to} className={computedClassName} {...props}>
      {children}
    </Link>
  );
}

export { Link };
