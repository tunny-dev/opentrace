import { TabClient } from "./tab-client";

export function generateStaticParams() {
  return [
    { tab: "traces" },
    { tab: "errors" },
    { tab: "sql" },
    { tab: "health" },
  ];
}

export default function Page() {
  return <TabClient />;
}
