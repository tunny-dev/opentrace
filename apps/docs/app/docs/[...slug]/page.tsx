import { notFound } from "next/navigation";
import { docsContentMap } from "@/lib/docs-content";
import { DocsLayout } from "@/components/docs-layout";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return Object.keys(docsContentMap).map((key) => ({
    slug: key.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  const doc = docsContentMap[key];

  if (!doc) {
    return { title: "Page Not Found - SpurTrace Docs" };
  }

  return {
    title: `${doc.title} - SpurTrace Documentation`,
    description: doc.description,
  };
}

export default async function DocSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");
  const doc = docsContentMap[key];

  if (!doc) {
    notFound();
  }

  return (
    <DocsLayout
      slugKey={key}
      title={doc.title}
      description={doc.description}
      group={doc.group}
      lastUpdated={doc.lastUpdated}
      badge={doc.badge}
      toc={doc.toc}
    >
      {doc.content}
    </DocsLayout>
  );
}
