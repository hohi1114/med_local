import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";
import StatisticsByRegionPage from "./pages/StatisticsByRegionPage";
import UpdateDataPage from "./pages/UpdateDataPage.tsx";
import MediMapPage from "./pages/MediMapPage";
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

function App() {
  const { fetchUserInfo } = useUpdateUserInfo();

  useEffect(() => {
    if (!window.location.pathname.startsWith("/login")) {
      fetchUserInfo();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<DashBoardPage />} />
          <Route
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
