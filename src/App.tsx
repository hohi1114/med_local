import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";
import StatisticsByRegionPage from "./pages/StatisticsByRegionPage";
import UpdateDataPage from "./pages/UpdateDataPage.tsx";
import MediMapPage from "./pages/MediMapPage";
import NaverScriptLoader from "./utils/NaverScriptLoader.tsx";
import SettingPage from "./pages/SettingPage.tsx";
import userStore from "./store/userStore.tsx";
import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "./utils/api/apis.ts";
import LoginPage from "./pages/LoginPage.tsx";

function App() {
  const { setUser } = userStore();
  const { data, refetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: false
  });

  useEffect(() => {
    if (!window.location.pathname.startsWith("/login")) {
      refetch();
    }
  }, []);
  //Store user data
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<BaseLayout />}>
          <Route path="dashboard" element={<DashBoardPage />} />
          <Route
            index
            path="map"
            element={
              <NaverScriptLoader>
                <MediMapPage />
              </NaverScriptLoader>
            }
          />

          <Route
            path="statistics-by-region"
            element={<StatisticsByRegionPage />}
          />
          <Route path="update_data" element={<UpdateDataPage />} />
          <Route
            path="statistics-by-region"
            element={<StatisticsByRegionPage />}
          />

          <Route path="compare-chart" element={<StatisticsByRegionPage />} />
          <Route path="setting" element={<SettingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
