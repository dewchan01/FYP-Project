import React from "react";
import { Card, Table } from "antd";

function RecentActivity({history, address}) {

  const columns = [
    {
      title: "Sender",
      dataIndex: "Sender",
      key: "Sender",
      render: (value, record) => (
        <div style={{ color: history?.[0] === address ? "red" : "black" }}>
          {value}
        </div>
      ),
    },
    {
      title: "Recipient",
      dataIndex: "Recipient",
      key: "Recipient",
      render: (value, record) => (
        <div style={{ color: history?.[1] === address ? "green" : "black" }}>
          {value}
        </div>
      ),
    },
    {
      title: "Send",
      dataIndex: "Send",
      key: "Send",
      render: (value, record) => (
        <div style={{ color: history?.[0] === address ? "red" : "black" }}>
          {history?.[0] === address ? "-" : ""}
          {value}
        </div>
      ),
    },
    
    {
      title: "Receive",
      dataIndex: "Receive",
      key: "Receive",
      render: (value, record) => (
        <div style={{ color: history?.[1] === address ? "green": "black"  }}>
          {history?.[1] === address ? "+" : "" }
          {value}
        </div>
      ),
    },
    {
      title: "Message",
      dataIndex: "Message",
      key: "Message",
    },
  ];
  
  const fieldNames = [
    "Sender",
    "Recipient",
    "Send",
    "Receive",
    "Message",
  ];
  
  const dataSource = [
    fieldNames.reduce((acc, field, index) => {
      if (history){
      if (field === "Sender" || field === "Recipient") {
        acc[field] = `${history[index].slice(0, 4)}...${history[index].slice(38)}`;
      } else if (field === "Send") {
        acc[field] = `${(history[index]/10**18).toFixed(2)} D${history[index + 2]}`;
      } else if (field === "Receive") {
        acc[field] = `${(history[index]/10**18).toFixed(2)} D${history[index + 2]}`;
      } else if (field === "Message") {
        acc[field] = ` ${history[index + 2]}`;
      }else {
        acc[field] = history[index];
      }
    }
      return acc;
    }, {}),
  ];
  return (
    <Card title="Recent Activity" style={{ width: "100%", minHeight: "663px" }}>
      <Table
        dataSource={dataSource}
        address = {address}
        columns={columns}
        pagination={{ position: ["bottomCenter"], pageSize: 8 }}
      />
    </Card>
  );
  
}

export default RecentActivity;
