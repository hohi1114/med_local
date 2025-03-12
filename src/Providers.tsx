import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";

export default function Providers({ children }: { children: React.ReactNode }) {
  const quertClient = new QueryClient();
  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#9F9FF8", fontFamily: `"Inter", sans-serif` }
      }}
    >
      <QueryClientProvider client={quertClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  );
}
