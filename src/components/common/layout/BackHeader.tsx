import { useNavigate } from "react-router-dom";

const BackHeader = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        padding: "1rem 2rem",
        backgroundColor: "white"
      }}
    >
      <img
        src={"images/arrow.svg"}
        style={{ width: 30, height: 30, cursor: "pointer" }}
        onClick={() => navigate(-1)}
      />
    </div>
  );
};
export default BackHeader;
