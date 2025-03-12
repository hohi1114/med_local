import BaseButton from "../components/common/button/BaseButton";
import { logout } from "../utils/api/apis";

export default function SettingPage() {
  const handleLogout = () => {
    logout();
  };
  return (
    <div>
      <BaseButton type="submit" onClick={handleLogout}>
        Logout
      </BaseButton>
    </div>
  );
}
