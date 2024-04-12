import React from "react";
import { Card } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { UserOutlined } from "@ant-design/icons";
import matic from "../matic.png";
import refreshAlert from "../refreshAlert";

function AccountDetails({ address, balance, lastLoginDate }) {

  refreshAlert({ address });
  const date = new Date(lastLoginDate);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  const duration = Date.now() - new Date(lastLoginDate);
  const dur_seconds = Math.floor(duration / 1000);
  const dur_minutes = Math.floor(dur_seconds / 60);
  const dur_hours = Math.floor(dur_minutes / 60);
  const dur_days = Math.floor(dur_hours / 24);

  let displayString;

  if (dur_days > 0) {
    displayString = dur_days + " day" + (dur_days > 1 ? "s" : "");
  } else if (dur_hours > 0) {
    displayString = dur_hours + " hour" + (dur_hours > 1 ? "s" : "");
  } else if (dur_minutes > 0) {
    displayString = dur_minutes + " minute" + (dur_minutes > 1 ? "s" : "");
  } else {
    displayString = dur_seconds + " second" + (dur_seconds > 1 ? "s" : "");
  }

  const readable_duration = displayString;

  return (
    <Card title="Account Details">
      <div className="accountDetailRow">
        <UserOutlined style={{ color: "#767676", fontSize: "25px" }} />
        <div>
          <div className="accountDetailHead"> {address} </div>
          <div className="accountDetailBody">
            {" "}
            Address: {address.slice(0, 4)}...{address.slice(38)}
          </div>
        </div>
      </div>
      <div className="accountDetailRow">
        <img src={matic} alt="maticLogo" width={25} />
        <div>
          <div className="accountDetailHead"> Native Sepolia Tokens</div>
          <div className="accountDetailBody">{balance} SepoliaETH</div>
        </div>
      </div>
      <div className="accountDetailRow">
        <ClockCircleOutlined style={{ color: "#767676", fontSize: "25px" }} />
        <div>
          <div className="accountDetailHead">Last Login: {dur_seconds < 5 ? 'Just now' : readable_duration + ' ago'} </div>
          <div className="accountDetailBody">
            {formattedDate} Singapore Time (GMT+8)
          </div>
        </div>
      </div>
      <div className="balanceOptions">
      </div>
    </Card>
  )
}

export default AccountDetails;
