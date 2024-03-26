import { Spin, Avatar } from "antd";
import React, { useState, useEffect } from "react";
import apiUrl from "../apiConfig";

function VisitedCount() {
    const [count, setCount] = useState(null);
    const baseURL = apiUrl();
    const fetchData = async () => {
        const result = await fetch(`${baseURL}/db`);
        const data = await result.json();
        setCount(data);
    };
    useEffect(() => {
        fetchData();
    }, [count]);

    return (
        <div>
            {count>0 ? (
                <p>
                    <Avatar size="large" src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${count}`} />
                    Total Visitors: <strong>{count}</strong>
                </p>
            ) : (
                <Spin size="large" />
            )}
        </div>
    );
}

export default VisitedCount;
