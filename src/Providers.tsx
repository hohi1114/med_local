import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import ko_KR from "antd/lib/locale/ko_KR";

export default function Providers({ children }: { children: React.ReactNode }) {
  const quertClient = new QueryClient();
  return (
    <ThemeProvider theme={theme}>
      <ConfigProvider
        locale={ko_KR}
        theme={{
          token: {
            colorPrimary: theme.colors.primary,
            fontFamily: `"Inter", sans-serif`
          },
          components: {
            Segmented: {
              itemSelectedColor: theme.colors.white,
              itemColor: theme.colors.black,
              itemSelectedBg: theme.colors.black01
            }
          }
        }}
      >
        <QueryClientProvider client={quertClient}>
          {children}
        </QueryClientProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
