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
import userStore from "./store/userStore.tsx";
import { useQuery } from "@tanstack/react-query";
import SettingPage from "./pages/SettingPage.tsx";
import { getUserInfo } from "./utils/api/apis.ts";

function App() {
  const { getRegionNameFromIndexDB } = useRegionNamesData();
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
    //📌 Fetch Region Names
    getRegionNameFromIndexDB();
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
          <Route path="/setting" element={<SettingPage />} />
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
  );
}

export default App;
