import { useState } from "react";

interface FileUploadProps {
    onFilesUploaded: (files: FileList) => void;
    title: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, title }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            setSelectedFiles(filesArray);
            onFilesUploaded(event.target.files);
        }
    };

    return (
        <div>
            <h3>{title}</h3>
            <input type="file" multiple accept=".xls,.xlsx" onChange={handleFileChange} />
            <ul>
                {selectedFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default FileUpload;
