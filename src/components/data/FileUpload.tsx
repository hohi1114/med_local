import { useState } from "react";
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
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (info: UploadChangeParam) => {
    if (info.fileList.length > 1) {
      info.fileList = [info.fileList[info.fileList.length - 1]]; // 가장 마지막 파일만 유지
    }

    const latestFile = info.fileList[0]?.originFileObj;
    if (latestFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(latestFile);
      const fileList = dataTransfer.files;

      onFilesUploaded(fileList);
      setFileName(latestFile.name);
    }
  };

  return (
    <FileUploadContainer>
      <TitleStyle>{title}</TitleStyle>
      <StyledDragger
        onChange={handleChange}
        multiple={false}
        accept=".xls"
        showUploadList={false}
        beforeUpload={() => false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-hint">
          데이터를 담은 .xlsx 파일을 첨부해주세요.
        </p>
      </StyledDragger>
      {fileName && <FileNameStyle>{fileName}</FileNameStyle>}
    </FileUploadContainer>
  );
};

export default FileUpload;

const FileUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const TitleStyle = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const StyledDragger = styled(Dragger)`
  width: 50vh;
`;

const FileNameStyle = styled.span`
  font-size: 1.2rem;
  color: #9f9ff8;
`;
