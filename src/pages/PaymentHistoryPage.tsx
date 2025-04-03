import { useQuery } from "@tanstack/react-query";
import { Table, Empty } from "antd";
import { getPaymentHistory } from "../utils/api/apis";
import BackHeader from "../components/common/layout/BackHeader";
import ContentHeader from "../components/common/layout/ContentHeader";
import styled from "styled-components";
import { ColumnType, TableProps } from "antd/es/table";
import { PaymentHistory } from "../types/membership";
function PaymentHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["paymentHistory"],
    queryFn: () => getPaymentHistory(),
    enabled: true,
    retry: false
  });

  const paymentHistoryData = data?.payment_history || [];

  const columns: ColumnType<PaymentHistory>[] = [
    {
      title: "날짜",
      dataIndex: "paid_date",
      key: "paid_date",
      align: "center"
    },
    {
      title: "설명",
      dataIndex: "info",
      key: "info",
      align: "center"
    },
    {
      title: "카드 정보",
      dataIndex: "card_last_num",
      key: "card_last_num",
      align: "center",
      render: (text: string) => (text ? `**** **** **** ${text}` : "-")
    },
    {
      title: "총 합계",
      dataIndex: "amount",
      key: "amount",
      align: "center",
      render: (amount: number) => `${amount.toLocaleString()}원`
    }
  ];

  return (
    <>
      <ContentHeader title="결제 내역 확인" />
      <BackHeader />
      <div style={{ padding: "0rem 2rem", backgroundColor: "white" }}>
        <ContentCard>
          <CardTitle>결제 내역</CardTitle>

          <StyledTable
            loading={isLoading}
            columns={columns}
            dataSource={paymentHistoryData}
            pagination={false}
            rowKey={(record, index) => record.paid_date + "_" + index}
            locale={{
              emptyText: <Empty description="결제 내역이 없습니다" />
            }}
          />
        </ContentCard>
      </div>
    </>
  );
}

const ContentCard = styled.div`
  padding: 2rem;
  border-radius: 0.6rem;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${(props) => props.theme.colors.gray06};
`;

const StyledTable = styled(Table)<TableProps<PaymentHistory>>`
  .ant-table {
    background-color: ${(props) => props.theme.colors.white};
    font-size: 1rem;
  }
`;
export default PaymentHistoryPage;
