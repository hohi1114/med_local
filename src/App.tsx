import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";
import StatisticsByRegionPage from "./pages/StatisticsByRegionPage";
import UpdateDataPage from "./pages/UpdateDataPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BaseLayout />}>
          <Route index path="dashboard" element={<DashBoardPage />} />
          <Route path="statistics-by-region" element={<StatisticsByRegionPage />}/>
            <Route path="update_data" element={<UpdateDataPage />} /> {/* ✅ 추가 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
