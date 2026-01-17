import Link from "next/link";

import type { MDXComponents } from "mdx/types";

const baseHeading =
  "scroll-m-20 text-balance font-semibold tracking-tight text-foreground";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1 className={`${baseHeading} text-3xl ${className ?? ""}`} {...props} />
    ),
    h2: ({ className, ...props }) => (
      <h2 className={`${baseHeading} text-2xl ${className ?? ""}`} {...props} />
    ),
    h3: ({ className, ...props }) => (
      <h3 className={`${baseHeading} text-xl ${className ?? ""}`} {...props} />
    ),
    p: ({ className, ...props }) => (
      <p
        className={`leading-relaxed text-muted-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul className={`list-disc space-y-2 pl-5 ${className ?? ""}`} {...props} />
    ),
    li: ({ className, ...props }) => (
      <li className={`text-muted-foreground ${className ?? ""}`} {...props} />
    ),
    a: ({ className, href, ...props }) =>
      href ? (
        <Link
          href={href}
          className={`text-foreground underline underline-offset-4 hover:text-primary ${className ?? ""}`}
          {...props}
        />
      ) : (
        <a
          className={`text-foreground underline underline-offset-4 hover:text-primary ${className ?? ""}`}
          {...props}
        />
      ),
    strong: ({ className, ...props }) => (
      <strong
        className={`font-semibold text-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    code: ({ className, ...props }) => (
      <code
        className={`rounded bg-muted px-1.5 py-0.5 text-xs text-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    ...components,
  };
}
