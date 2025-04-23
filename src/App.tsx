import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";
import StatisticsByRegionPage from "./pages/StatisticsByRegionPage";
import UpdateDataPage from "./pages/UpdateDataPage.tsx";
import NaverScriptLoader from "./utils/NaverScriptLoader.tsx";
import SettingPage from "./pages/SettingPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ComingSoonPage from "./pages/ComingSoonPage.tsx";
import MembershipPage from "./pages/MembershipPage.tsx";
import useUpdateUserInfo from "./hooks/useUpdateUserInfo.tsx";
import MembershipChangePage from "./pages/MembershipChangePage.tsx";
import CardManagementPage from "./pages/CardManagementPage.tsx";
import PaymentHistoryPage from "./pages/PaymentHistoryPage.tsx";
import CompareAvenuePage from "./pages/CompareAvenuePage.tsx";
import MapByRegionPage from "./pages/MapByRegionPage.tsx";
import { Alert } from "antd";

export const isDemo = import.meta.env.VITE_DEMO === "true" ? true : false;
function App() {
  const { fetchUserInfo } = useUpdateUserInfo();

  useEffect(() => {
    if (!window.location.pathname.startsWith("/login")) {
      fetchUserInfo();
    }
  }, []);

  return (
    <BrowserRouter>
      {import.meta.env.VITE_DEMO === "true" && (
        <Alert
          message="데모 버전에는 2024.11.30 부터 2024.12.31까지의 데이터만 존재합니다."
          type="info"
          style={{
            width: "30%",
            position: "fixed",
            bottom: 0,
            right: 0,
            zIndex: 100
          }}
          closable
        />
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<DashBoardPage />} />
          <Route
            path="map"
            element={
              <NaverScriptLoader>
                <MapByRegionPage />
              </NaverScriptLoader>
            }
          />
          <Route
            path="statistics-by-region"
            element={<StatisticsByRegionPage />}
          />
          <Route path="update_data" element={<UpdateDataPage />} />
          <Route path="compare-chart" element={<ComingSoonPage />} />
          <Route path="account" element={<SettingPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="membership-change" element={<MembershipChangePage />} />
          <Route path="manage-card" element={<CardManagementPage />} />
          <Route path="payment-history" element={<PaymentHistoryPage />} />
          <Route
            path="compare-avenue"
            element={
              <NaverScriptLoader>
                <CompareAvenuePage />
              </NaverScriptLoader>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
