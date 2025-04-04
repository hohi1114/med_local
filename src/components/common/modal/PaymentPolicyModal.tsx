import { Modal } from "antd";
import styled from "styled-components";
interface PaymentPolicyModalProps {
  policyModal: boolean;
  handlePolicyModal: () => void;
}
const PaymentPolicyModal = ({
  policyModal,
  handlePolicyModal
}: PaymentPolicyModalProps) => {
  return (
    <Modal
      width={900}
      open={policyModal}
      footer={null}
      centered
      onCancel={handlePolicyModal}
    >
      <Wrapper>
        <Title>결제사 정보제공 안내</Title>
        <p>관계법령에 따라 소비자 정보를 아래처럼 결제 대행사에 제공합니다.</p>
        <Table>
          <thead>
            <tr>
              <th>신용카드 정보</th>
              <th>문의</th>
              <th>제공 정보</th>
              <th>이용 목적</th>
              <th>이용기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>수신자 나이스페이먼츠(주)</td>
              <td>
                010-9278-2232 <br /> 스프레이
              </td>
              <td>카드번호, 유효기간, 카드 비밀번호 앞 2자리, 생년월일</td>
              <td>결제 처리 및 대금 청구</td>
              <td>5년(금융감독원 규정에 의거 5년간 의무보관)</td>
            </tr>
          </tbody>
        </Table>
        <SectionTitle>관계법령</SectionTitle>
        <p>
          <strong>정보통신망 이용촉진 및 정보보호등에 관한 법률</strong>
          <br />
          제 22조(개인정보의 수집 이용 동의 등)
          <br />
          정보통신서비스 제공자는 다음 각 호의 어느 하나에 해당하는 경우에는
          제1항에 따른 동의 없이 이용자의 개인정보를 수집·이용할 수 있다.
          <br />
          (2) 정보통신서비스의 제공에 따른 요금정산을 위하여 필요한 경우
        </p>
        <p>
          <strong>전자상거래등에서의 소비자보호에 관한 법률</strong>
          <br />
          제 21조(금지행위)
          <br />
          전자상거래를 행하는 사업자 또는 통신판매업자는 다음 각호의 1에
          해당하는 행위를 하여서는 아니된다.
          <br />
          (6) 본인의 허락을 받지 아니하거나 허락 받은 범위를 넘어 소비자에 관한
          정보를 이용하는 행위. 다만, 다음 각목의 1에 해당하는 경우를 제외한다.
          <br />
          나. 재화등의 거래에 따른 대금정산을 위하여 필요한 경우
        </p>
      </Wrapper>
    </Modal>
  );
};

const Wrapper = styled.div`
  padding: 20px;
  line-height: 1.6;
  background-color: ${(props) => props.theme.colors.white};
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;

  th,
  td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 20px;
`;

export default PaymentPolicyModal;
