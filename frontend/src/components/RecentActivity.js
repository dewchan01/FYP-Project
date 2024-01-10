import React from "react";
import { Card, Table } from "antd";

function RecentActivity({ history, address }) {
  console.log("history", history);
  history = history?.slice()?.reverse();
  const columns = [
    {
      title: "Time (GMT+8)",
      dataIndex: "Time",
      key: "Time",
      render: (value, record) => {
        const date = new Date(value * 1000)
        date.setHours(date.getHours() + 8);
        return <span>{date.toISOString().replace(/T/, ' ').replace(/\..+/, '')}</span>;
      }
    }
    
    , {
  title: "Sender",
    dataIndex: "Sender",
      key: "Sender",
        render: (value, record) => (
          <div style={{ color: record.isSender && !record.Message.includes("use voucher")? "red" : "black" }}>{value}</div>
        ),
    },
{
  title: "Recipient",
    dataIndex: "Recipient",
      key: "Recipient",
        render: (value, record) => (
          <div style={{ color: record.isRecipient && !record.Message.includes("use voucher") ? "green" : "black" }}>
            {value}
          </div>
        ),
    },
{
  title: "Send",
    dataIndex: "Send",
      key: "Send",
        render: (value, record) => (
          <div style={{ color: record.isSender && !record.Message.includes("use voucher") ? "red" : "black" }}>
            {record.isSender ? "-" : ""}
            {value}
          </div>
        ),
    },
{
  title: "Receive",
    dataIndex: "Receive",
      key: "Receive",
        render: (value, record) => (
          <div style={{ color: record.isRecipient && !record.Message.includes("use voucher")? "green" : "black" }}>
            {record.isRecipient ? "+" : ""}
            {value}
          </div>
        ),
    },
{
  title: "Message",
    dataIndex: "Message",
      key: "Message",
        render: (value, record) => (
          record.Sender + " " + value + " " + (value.includes("unused voucher")|| value.includes("use voucher")?"":record.Recipient)
        )
    },
  ];

const fieldNames = ["Sender", "Recipient", "Send", "Receive", "Time", "Message"];

const dataSource = history?.map((item, index) => {
  const record = fieldNames.reduce((acc, field, i) => {
    if (history) {
      if (field === "Sender" || field === "Recipient") {
        acc[field] = `${item[i].slice(0, 4)}...${item[i].slice(38)}`;
        acc[`is${field}`] = item[i] === address;
      } else if (field === "Send" || field === "Receive") {
        acc[field] = `${(item[i] / 10 ** 18).toFixed(2)} D${item[i + 2]}`;
        acc[`is${field}`] = item[i] === address;
      } else if (field === "Message" ||field === "Time") {
        acc[field] = ` ${item[i + 2]}`;
      } else {
        acc[field] = item[i];
      }
    }
    return acc;
  }, {});
  return record;
});

return (
  <Card title="Recent Activity"
    style={{
      width: "100%", minHeight: "663px",
    }}>
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={{ position: ["bottomCenter"], pageSize: 5 }}
    />
  </Card>
);
}

export default RecentActivity;
