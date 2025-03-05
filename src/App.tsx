import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/BaseLayout";
import UpdateDataPage from "./pages/UpdateDataPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BaseLayout />}>
          <Route path="dashboard" element={<DashBoardPage />} />
            <Route path="update_data" element={<UpdateDataPage />} /> {/* ✅ 추가 */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

