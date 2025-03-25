import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";

export default function Providers({ children }: { children: React.ReactNode }) {
  const quertClient = new QueryClient();
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#3897f0", //#9f9ff8
          fontFamily: `"Inter", sans-serif`
        },
        components: {
          Segmented: {
            itemSelectedColor: "#fafaf8 !important",
            itemColor: "#1a1a1a !important",
            itemSelectedBg: "#333333 !important"
          }
        }
      }}
    >
      <QueryClientProvider client={quertClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  );
}
