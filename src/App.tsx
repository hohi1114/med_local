import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";
import StatisticsByRegionPage from "./pages/StatisticsByRegionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BaseLayout />}>
          <Route index path="dashboard" element={<DashBoardPage />} />
          <Route
            path="statistics-by-region"
            element={<StatisticsByRegionPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
