import React, { useState } from "react";
import "../styles/Masters.css";
import EscalationMaster from "./EscalationMaster.jsx";
import DivisionMaster from "./DivisionMaster.jsx";
import DegreeMaster from "./DegreeMaster.jsx";
import DepartmentMaster from "./DepartmentMaster.jsx";

const SUBTABS = [
  { key: "escalation", label: "Escalation Masters" },
  { key: "division", label: "Division Master" },
  { key: "degree", label: "Degree Master" },
  { key: "department", label: "Department Master" },
  // later you can add more: { key: "something", label: "Something Else" }
];

function Masters() {
  const [activeTab, setActiveTab] = useState("escalation");

  return (
    <div className="masters-container">
      {/* Header */}
      <div className="masters-header">
        <h2 className="masters-title">Masters</h2>
        <p className="masters-subtitle">
          Manage configuration for escalation and other master data.
        </p>
      </div>

      {/* Subtabs */}
      <div className="masters-tabs">
        {SUBTABS.map((tab) => (
          <button
            key={tab.key}
            className={
              "masters-tab" +
              (activeTab === tab.key ? " masters-tab--active" : "")
            }
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="masters-tab-panels">
        {activeTab === "escalation" && <EscalationMaster />}
        {activeTab === "division" && <DivisionMaster />}
        {activeTab === "degree" && <DegreeMaster />}
        {activeTab === "department" && <DepartmentMaster />}
        {/* future tabs: 
          {activeTab === "something" && <SomethingMaster />} 
        */}
      </div>
    </div>
  );
}

export default Masters;
