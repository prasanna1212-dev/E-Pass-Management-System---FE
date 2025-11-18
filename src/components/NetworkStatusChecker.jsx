import React, { useState, useEffect } from "react";
import axios from "axios";
import { Message } from "primereact/message";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";

const NetworkStatusChecker = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isConnected, setIsConnected] = useState(true);

  const checkBackendConnection = async () => {
    try {
      await axios.get(`${API_BASE_URL}/network-status`);
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkBackendConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOffline = () => setIsConnected(false);
    const handleOnline = () => checkBackendConnection();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <>
      {!isConnected && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <Message
            severity="error"
            text="Connection Lost: Server Connection could not be established. The server is down or there is a connection problem."
          />
        </div>
      )}
    </>
  );
};

export default NetworkStatusChecker;
