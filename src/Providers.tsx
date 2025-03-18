import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";

export default function Providers({ children }: { children: React.ReactNode }) {
  const quertClient = new QueryClient();
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9F9FF8",
          fontFamily: `"Inter", sans-serif`
        },
        components: {
          Segmented: {
            itemSelectedColor: "#ffffff !important",
            itemColor: "#9F9FF8",
            itemSelectedBg: "#9F9FF8 !important",
            itemHoverColor: "#5a4ec5"
          }
        }
      }}
    >
      <QueryClientProvider client={quertClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  );
}
