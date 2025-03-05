import { Input } from "antd";

const { Search } = Input;

interface SearchInputProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const SearchInput = ({ handleInputChange }: SearchInputProps) => {
  return (
    <Search
      placeholder="검색어"
      style={{ width: 200 }}
      onChange={handleInputChange}
    />
  );
};

export default SearchInput;
