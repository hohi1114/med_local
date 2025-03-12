import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";
import StatisticsByRegionPage from "./pages/StatisticsByRegionPage";
import UpdateDataPage from "./pages/UpdateDataPage.tsx";
import MediMapPage from "./pages/MediMapPage";
import NaverScriptLoader from "./utils/NaverScriptLoader.tsx";
import { useEffect } from "react";
import useRegionNamesData from "./hooks/useRegionNamesData.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const { getRegionNameFromIndexDB } = useRegionNamesData();

  useEffect(() => {
    //📌 Fetch Region Names
    getRegionNameFromIndexDB();
  }, []);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<BaseLayout />}>
            <Route index path="dashboard" element={<DashBoardPage />} />
            <Route
              path="statistics-by-region"
              element={<StatisticsByRegionPage />}
            />
            <Route path="update_data" element={<UpdateDataPage />} />
            <Route
              path="statistics-by-region"
              element={<StatisticsByRegionPage />}
            />
            <Route
              path="map"
              element={
                <NaverScriptLoader>
                  <MediMapPage />
                </NaverScriptLoader>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
