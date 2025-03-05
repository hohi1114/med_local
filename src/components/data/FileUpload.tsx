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

    if (fileList.length > 0) {
      const dataTransfer = new DataTransfer();
      fileList.forEach((file) => dataTransfer.items.add(file));

      onFilesUploaded(dataTransfer.files);
    }
  };

  return (
    <FileUploadContainer>
      <TitleStyle>{title}</TitleStyle>
      <StyledDragger
        onChange={handleChange}
        multiple={false}
        accept=".xls,.xlsx"
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-hint">
          데이터를 담은 .xlsx 파일을 첨부해주세요.
        </p>
      </StyledDragger>
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
