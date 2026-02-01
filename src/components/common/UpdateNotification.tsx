import { useEffect, useState } from "react";
import { Modal } from "antd";

export default function UpdateNotification() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!window.electron) return;

    const cleanup = window.electron.onUpdateDownloaded(() => {
      setUpdateReady(true);
    });

    return cleanup;
  }, []);

  const handleRestart = () => {
    window.electron?.installUpdate();
  };

  return (
    <Modal
      title="업데이트 알림"
      open={updateReady}
      okText="지금 재시작"
      cancelText="나중에"
      onOk={handleRestart}
      onCancel={() => setUpdateReady(false)}
    >
      <p>새 버전이 다운로드되었습니다.</p>
      <p>재시작하여 업데이트를 적용하시겠습니까?</p>
    </Modal>
  );
}
