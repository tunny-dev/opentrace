import { TabClient } from "./tab-client";

export function generateStaticParams() {
  return [
    { tab: "traces" },
    { tab: "stream" },
    { tab: "raw" },
    { tab: "logs" },
    { tab: "routes" },
    { tab: "client" },
    { tab: "errors" },
    { tab: "sql" },
    { tab: "health" },
  ];
}

export default function Page() {
  return <TabClient />;
}
