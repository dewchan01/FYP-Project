import React from "react";
import { Spin } from "antd"; // You can replace this with your preferred loading spinner library or create your own styles

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
      <Spin size="large" />
    </div>
  );
}

export default LoadingSpinner;
