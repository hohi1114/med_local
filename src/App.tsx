import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";
import StatisticsByRegionPage from "./pages/StatisticsByRegionPage";
import UpdateDataPage from "./pages/UpdateDataPage.tsx";
import MediMapPage from "./pages/MediMapPage";
import NaverScriptLoader from "./utils/NaverScriptLoader.tsx";

import SettingPage from "./pages/SettingPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="map" />} />

        <Route path="/" element={<BaseLayout />}>
          <Route
            index
            path="map"
            element={
              <NaverScriptLoader>
                <MediMapPage />
              </NaverScriptLoader>
            }
          />
          <Route path="dashboard" element={<DashBoardPage />} />

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
