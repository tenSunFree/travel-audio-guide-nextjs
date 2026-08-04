"use client";

import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(markdown: string) {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(marked.parse(markdown || "") as string, {
    USE_PROFILES: { html: true },
  });
}
