import { useEffect, useState } from "react";
import { Modal, Progress } from "antd";

export default function UpdateNotification() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!window.electron) return;

    const cleanupAvailable = window.electron.onUpdateAvailable(() => {
      setIsUpdating(true);
      setProgress(0);
    });

    const cleanupProgress = window.electron.onUpdateProgress((percent) => {
      setProgress(percent);
    });

    const cleanupDownloaded = window.electron.onUpdateDownloaded(() => {
      setUpdateReady(true);
    });

    return () => {
      cleanupAvailable();
      cleanupProgress();
      cleanupDownloaded();
    };
  }, []);

  const handleRestart = () => {
    window.electron?.installUpdate();
  };

  // 다운로드 중 (사용 차단)
  if (isUpdating && !updateReady) {
    return (
      <Modal
        title="업데이트 다운로드 중"
        open={true}
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={null}
      >
        <p>새 버전을 다운로드하고 있습니다. 잠시만 기다려주세요.</p>
        <Progress percent={progress} status="active" />
      </Modal>
    );
  }

  // 다운로드 완료
  if (updateReady) {
    return (
      <Modal
        title="업데이트 준비 완료"
        open={true}
        closable={false}
        maskClosable={false}
        keyboard={false}
        okText="지금 재시작"
        cancelButtonProps={{ style: { display: "none" } }}
        onOk={handleRestart}
      >
        <p>새 버전이 다운로드되었습니다.</p>
        <p>재시작하여 업데이트를 적용합니다.</p>
        <Progress percent={100} status="success" />
      </Modal>
    );
  }

  return null;
}
