import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashBoardPage from "./pages/DashBoardPage";
import BaseLayout from "./components/common/layout/BaseLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BaseLayout />}>
          <Route path="dashboard" element={<DashBoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
