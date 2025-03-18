import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";

export default function Providers({ children }: { children: React.ReactNode }) {
  const quertClient = new QueryClient();
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9F9FF8",
          fontFamily: `"Inter", sans-serif`,
        },
        components: {
          Segmented: {
            itemSelectedColor: "#fafaf8",
            itemColor: "#1a1a1a",
            itemSelectedBg: "#333",
            itemHoverColor: "#fafaf8",
          },
        },
      }}
    >
      <QueryClientProvider client={quertClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  );
}
