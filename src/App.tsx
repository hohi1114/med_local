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
import { getUserInfo, getUserSubscription } from "./utils/api/apis.ts";
import LoginPage from "./pages/LoginPage.tsx";
import ComingSoonPage from "./pages/ComingSoonPage.tsx";
import MembershipPage from "./pages/MembershipPage.tsx";
import PaymentPolicyPage from "./pages/PaymentPolicyPage.tsx";

function App() {
  const { setUser } = userStore();
  const { data: userData, refetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    enabled: false
  });
  const { data: subscribeDate, refetch: subscribeRefetch } = useQuery({
    queryKey: ["subscribe"],
    queryFn: () => getUserSubscription(),
    enabled: false,
    retry: false
  });

  useEffect(() => {
    if (!window.location.pathname.startsWith("/login")) {
      refetch();
      subscribeRefetch();
    }
  }, []);

  // 자동 로그인's fetch user data
  useEffect(() => {
    if (userData && subscribeDate) {
      const combinedData = {
        ...userData,
        subscribedStatus: subscribeDate.status,
        plan: subscribeDate.plan,
        nextBillingDate: subscribeDate.next_billing_date,
        isFreeTrial: subscribeDate.is_free_trial,
        trialEndDate: subscribeDate.trial_end_date
      };
      setUser(combinedData);
    }
  }, [userData, subscribeDate, setUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/payment-policy" element={<PaymentPolicyPage />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
