import { Col, Drawer, Row } from "antd";

const StatisticsDrawer = () => {
  return (
    <Drawer
      width={"40rem"}
      placement="right"
      closable={false}
      //   onClose={onClose}
      open={false}
    >
      <p
        className="site-description-item-profile-p"
        style={{ marginBottom: 24 }}
      >
        User Profile
      </p>
      <p className="site-description-item-profile-p">Personal</p>
      <Row>
        <Col span={12}></Col>
        <Col span={12}></Col>
      </Row>
    </Drawer>
  );
};

export default StatisticsDrawer;
