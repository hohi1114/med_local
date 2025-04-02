import { Modal } from "antd";
import usePaymentStore from "../../store/usePaymenyStore";
import FreeTrialInformation from "./FreeTrialInformation";
import PaymentForm from "./PaymentForm";
import RegisterCard from "./RegisterCard";
import CompletePayment from "./CompletePayment";
import { useQuery } from "@tanstack/react-query";
import { getMemberships } from "../../utils/api/apis";
import { useEffect } from "react";

export const PAYMENT_TERMS = [
  {
    id: "구매안내",
    content: [
      "이용제한을 풀기위한 체험한 종료 및 멤버십 취소는 멤버십 관리탭에서 설정 가능합니다.",
      "7일 체험판 종료 후, 멤버십은 구매한 시점부터 바로 적용됩니다.",
      "매월 정기 결제일에 자동으로 결제됩니다.",
      "멤버십은 언제든 해지할 수 있으며 해지해도 결제 만료일까지 사용가능합니다.",
      "멤버십 변경은 멤버십 관리 페이지에서 가능합니다. 변경 시 이용 중인 멤버십이 종료된 후 변경된 멤버십으로 전환됩니다."
    ]
  },
  {
    id: "환불 안내",
    content: ["멤버십 사용 중에는 남은 기간에 대한 금액이 환불되지 않습니다."]
  },
  {
    id: "기타",
    content: ["환불 및 기타 문의 사항은 직접 문의 부탁드립니다."]
  }
];

export const FreeTrialModal = () => {
  const { process, setProcess } = usePaymentStore();

  return (
    <Modal
      open={true}
      footer={null}
      closeIcon={null}
      centered
      styles={{
        content: { padding: "2rem", maxHeight: "80vh", overflowY: "auto" }
      }}
    >
      {process === "information" && <FreeTrialInformation />}
      {process === "payment" && <PaymentForm />}
      {process === "register_card" && (
        <RegisterCard handleCompleteUpdate={() => setProcess("payment")} />
      )}
      {process === "complete" && <CompletePayment />}
    </Modal>
  );
};
