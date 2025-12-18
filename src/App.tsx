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
import HospitalMapAnalysisPage from "./pages/HospitalMapAnalysisPage.tsx";
import PatientComparisonPage from "./pages/PatientComparisonPage";


// ⭐ Admin 페이지 import
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";

function App() {
  const { fetchUserInfo } = useUpdateUserInfo();

  useEffect(() => {
    // Admin 페이지와 일반 로그인 페이지는 제외
    if (
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/admin")
    ) {
      fetchUserInfo();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 일반 사용자 로그인 */}
        <Route path="/login" element={<LoginPage />} />

        {/* ⭐ Admin 라우트 (BaseLayout 없이 독립적으로) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/patient-comparison" element={<PatientComparisonPage />} />
        <Route path="/admin/hospital-map" element={
          <NaverScriptLoader>
            <HospitalMapAnalysisPage />
          </NaverScriptLoader>
        }
        />

        {/* 일반 사용자 페이지 (BaseLayout 적용) */}
        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<DashBoardPage />} />
          <Route path="/admin/map" element={<HospitalMapAnalysisPage />} />
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
