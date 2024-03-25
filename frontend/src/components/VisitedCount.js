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
                    You are our <strong>{count}<sup>{count > 0 ? (count%10 === 1 ? "st" : count%10 === 2 ? "nd" : count%10 === 3 ? "rd" : "th") : "th"}</sup></strong> customer!
                </p>
            ) : (
                <Spin size="large" />
            )}
        </div>
    );
}

export default VisitedCount;
