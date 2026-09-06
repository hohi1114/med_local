import styled from "styled-components";
import { InboxOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import { UploadChangeParam } from "antd/es/upload";

const { Dragger } = Upload;

interface FileUploadProps {
  title: string;
  onFilesUploaded: (files: FileList) => void;
}

const FileUpload = ({ title, onFilesUploaded }: FileUploadProps) => {
  const handleChange = (info: UploadChangeParam) => {
    const fileList = info.fileList
      .map((fileWrapper) => fileWrapper.originFileObj)
      .filter(Boolean) as File[];

    if (fileList.length === 0) {
      onFilesUploaded(new DataTransfer().files);
      return;
    }

    // 허용 확장자
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const validFiles = fileList.filter((file) =>
      allowedExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (validFiles.length === 0) {
      // 허용되지 않는 파일만 있으면 무시
      onFilesUploaded(new DataTransfer().files);
      return;
    }

    // 유효한 파일만 DataTransfer로 변환
    const dataTransfer = new DataTransfer();
    validFiles.forEach((file) => dataTransfer.items.add(file));

    onFilesUploaded(dataTransfer.files);
  };

  return (
    <FileUploadContainer>
      <TitleStyle>{title}</TitleStyle>
      <StyledDragger
        onChange={handleChange}
        multiple={true}
        accept=".xls,.xlsx,.csv"  // ← CSV 허용
        height={150}
        showUploadList={true}
        beforeUpload={() => false} // 자동 업로드 방지 (로컬 처리용)
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-hint">
          데이터를 담은 <strong>.xlsx</strong> 또는 <strong>.csv</strong> 파일을 첨부해주세요.
        </p>
      </StyledDragger>
    </FileUploadContainer>
  );
};

export default FileUpload;

// ── 스타일 ───────────────────────────────────────
const FileUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TitleStyle = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const StyledDragger = styled(Dragger)`
  width: 50vh;
  .ant-upload-hint {
    strong {
      color: #1890ff;
    }
  }
`;