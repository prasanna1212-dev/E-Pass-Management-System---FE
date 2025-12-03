import React, { useEffect, useState } from "react";
import {
  Tabs,
  Card,
  Tag,
  Table,
  Avatar,
  Tooltip,
  Spin,
  Empty,
  notification,
  Button,
  Select,
  Space,
} from "antd";
import { FaUserShield, FaUserCog } from "react-icons/fa";
import { ReloadOutlined } from "@ant-design/icons";
import { MdSecurity } from "react-icons/md";
import "../styles/RoleBasedAccess.css";

const { TabPane } = Tabs;
const { Option } = Select;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ROLE_CARDS = [
  {
    key: "warden",
    name: "Warden",
    icon: <MdSecurity />,
    accentClass: "role-card--warden",
    pill: "High Priority",
    description:
      "Responsible for overall hostel monitoring, outpass approvals and emergency escalations.",
    accessibleTabs: [
      "Dashboard",
      "Outpass Request",
      "QR Verification",
      "Masters",
    ],
  },
  {
    key: "admin",
    name: "Admin",
    icon: <FaUserCog />,
    accentClass: "role-card--admin",
    pill: "System Config",
    description:
      "Manages system configuration, master data, and has full access to dashboards and reports.",
    accessibleTabs: [
      "Dashboard",
      "Outpass Request",
      "QR Verification",
      "Approval Request",
      "Approved Users",
      "Masters",
      "Reports",
      "Role Based Access",
    ],
  },
  {
    key: "security",
    name: "Security",
    icon: <FaUserShield />,
    accentClass: "role-card--security",
    pill: "Gate Control",
    description:
      "Handles entry/exit verification at gates, scans QR codes and enforces outpass validity.",
    accessibleTabs: ["QR Verification"],
  },
];

function RoleBasedAccess() {
  const [activeTab, setActiveTab] = useState("roles");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // dropdown draft value per row
  const [roleDrafts, setRoleDrafts] = useState({});
  // loading state for Assign button
  const [assigningId, setAssigningId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch(
        `${API_BASE_URL}/approved-users-route/approved-users`
      );
      if (!res.ok) throw new Error("Failed to fetch approved users");

      const data = await res.json();
      setUsers(data);

      // prefill drafts with current elevated roles
      const initialDrafts = {};
      data.forEach((u) => {
        const r = (u.role || "").toLowerCase();
        if (["warden", "admin", "security"].includes(r)) {
          initialDrafts[u.id] = r;
        }
      });
      setRoleDrafts(initialDrafts);
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Unable to load users",
        description:
          err.message || "Something went wrong while fetching user accounts.",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async (userId, newRole) => {
    if (!newRole) {
      notification.error({
        message: "Role required",
        description: "Please select a role before assigning.",
        placement: "topRight",
      });
      return;
    }

    try {
      setAssigningId(userId);
      const res = await fetch(
        `${API_BASE_URL}/approved-users-route/update-role/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");

      notification.success({
        message: `Role Updated`,
        description: `${userEmail} is now assigned as ${newRole.toUpperCase()}.`,
        placement: "topRight",
        duration: 3,
      });

      // reload to stay in sync with backend
      fetchUsers();
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Update Failed",
        description:
          err.message || "Could not update user role. Please try again.",
        placement: "topRight",
        duration: 3,
      });
    } finally {
      setAssigningId(null);
    }
  };

  const userColumns = [
    {
      title: "Employee",
      dataIndex: "employee_number",
      key: "employee_number",
      render: (emp, record) => (
        <div className="rba-user-emp">
          <Avatar className="rba-user-avatar">
            {(record.email || record.domain_join_upn || "?")
              .charAt(0)
              .toUpperCase()}
          </Avatar>
          <div className="rba-user-emp-text">
            <span className="rba-user-email-main">
              {record.email || record.domain_join_upn}
            </span>
            <span className="rba-user-emp-sub">Emp No: {emp || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Domain Name",
      dataIndex: "domain_join_upn",
      key: "domain_join_upn",
      render: (text) => (
        <span className="rba-user-muted">{text || "-"}</span>
      ),
    },
    {
      title: "Domain",
      dataIndex: "domain_to_join",
      key: "domain_to_join",
      render: (text) => (
        <Tag color="blue" className="rba-tag-pill">
          {text || "kggroup.com"}
        </Tag>
      ),
    },
    // 🔹 NEW COLUMN: shows whatever is currently stored in DB
    {
      title: "Current Role",
      dataIndex: "role",
      key: "current_role",
      render: (role) => {
        const raw = (role || "user").toLowerCase();
        const label = raw.charAt(0).toUpperCase() + raw.slice(1);

        let color = "default";
        if (raw === "admin") color = "geekblue";
        else if (raw === "warden") color = "volcano";
        else if (raw === "security") color = "purple";

        return (
          <Tag color={color} className="rba-tag-pill">
            {label}
          </Tag>
        );
      },
    },
    // column for assigning/updating role
    {
      title: "Role",
      key: "role_assign",
      render: (_, record) => {
        const currentDraft =
          roleDrafts[record.id] ||
          (["warden", "admin", "security"].includes(
            (record.role || "").toLowerCase()
          )
            ? (record.role || "").toLowerCase()
            : undefined);

        return (
          <Space>
            <Select
              size="small"
              className="rba-role-select"
              style={{ minWidth: 130 }}
              placeholder="Select Role"
              value={currentDraft}
              onChange={(val) =>
                setRoleDrafts((prev) => ({ ...prev, [record.id]: val }))
              }
            >
              <Option value="warden">Warden</Option>
              <Option value="admin">Admin</Option>
              <Option value="security">Security</Option>
            </Select>
            <Button
              size="small"
              type="primary"
              loading={assigningId === record.id}
              disabled={!currentDraft}
              onClick={() => handleAssignRole(record.id, currentDraft)}
            >
              Assign
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Approved",
      dataIndex: "approved_at",
      key: "approved_at",
      render: (val, record) =>
        record.is_approved ? (
          <Tooltip
            title={
              val
                ? new Date(val).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Approved"
            }
          >
            <Tag color="success" className="rba-tag-pill">
              Approved
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="warning" className="rba-tag-pill">
            Pending
          </Tag>
        ),
    },
  ];

  return (
    <div className="role-based-access-container">
      {/* Header */}
      <div className="role-based-access-header">
        <div>
          <h2 className="role-based-access-title">Role Based Access</h2>
          <p className="role-based-access-subtitle">
            Configure high-level roles and manage which accounts have elevated access.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="role-based-access-tabs-wrap">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="role-based-access-tabs"
        >
          <TabPane tab="Roles" key="roles">
            <div className="rba-roles-grid">
              {ROLE_CARDS.map((role) => (
                <Card
                  key={role.key}
                  className={`rba-role-card ${role.accentClass}`}
                  hoverable
                >
                  <div className="rba-role-card-header">
                    <div className="rba-role-icon-badge">{role.icon}</div>
                    <div className="rba-role-title-block">
                      <h3 className="rba-role-name">{role.name}</h3>
                      <span className="rba-role-pill">{role.pill}</span>
                    </div>
                  </div>
                  <p className="rba-role-description">{role.description}</p>
                  <div className="role-card-tabs-section">
                    <div className="role-card-tabs-label">Accessible Tabs</div>
                    <div className="role-card-tabs">
                      {role.accessibleTabs.map((tab) => (
                        <span key={tab} className="role-card-tab-pill">
                          {tab}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabPane>

          <TabPane tab="User Accounts" key="users">
            <div className="rba-users-header-row">
              <div>
                <h3 className="rba-users-title">Approved Users</h3>
                <p className="rba-users-subtitle">
                  Assign elevated roles like Warden, Admin, or Security to approved accounts.
                </p>
              </div>
              <Button
                type="default"
                size="small"
                onClick={fetchUsers}
                className="rba-refresh-btn"
              >
                <ReloadOutlined />
                Refresh
              </Button>
            </div>

            <div className="rba-users-table-wrapper">
              {loadingUsers ? (
                <div className="rba-users-loading">
                  <Spin />
                </div>
              ) : users && users.length > 0 ? (
                <Table
                  rowKey="id"
                  columns={userColumns}
                  dataSource={users}
                  pagination={{ pageSize: 10 }}
                  className="rba-users-table"
                />
              ) : (
                <div className="rba-users-empty">
                  <Empty description="No approved user accounts found." />
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}

export default RoleBasedAccess;



// import React, { useEffect, useState } from "react";
// import {
//   Tabs,
//   Card,
//   Tag,
//   Table,
//   Avatar,
//   Tooltip,
//   Spin,
//   Empty,
//   notification,
//   Button,
//   Select,
//   Space,
// } from "antd";
// import { FaUserShield, FaUserTie, FaUserCog } from "react-icons/fa";
// import { ReloadOutlined } from "@ant-design/icons";
// import { MdSecurity } from "react-icons/md";
// import "../styles/RoleBasedAccess.css";

// const { TabPane } = Tabs;
// const { Option } = Select;

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const ROLE_CARDS = [
//   {
//     key: "warden",
//     name: "Warden",
//     icon: <MdSecurity />,
//     accentClass: "role-card--warden",
//     pill: "High Priority",
//     description:
//       "Responsible for overall hostel monitoring, outpass approvals and emergency escalations.",
//   },
//   {
//     key: "admin",
//     name: "Admin",
//     icon: <FaUserCog />,
//     accentClass: "role-card--admin",
//     pill: "System Config",
//     description:
//       "Manages system configuration, master data, and has full access to dashboards and reports.",
//   },
//   {
//     key: "security",
//     name: "Security",
//     icon: <FaUserShield />,
//     accentClass: "role-card--security",
//     pill: "Gate Control",
//     description:
//       "Handles entry/exit verification at gates, scans QR codes and enforces outpass validity.",
//   },
// ];

// function RoleBasedAccess() {
//   const [activeTab, setActiveTab] = useState("roles");
//   const [users, setUsers] = useState([]);
//   const [loadingUsers, setLoadingUsers] = useState(false);

//   // for dropdown value per row
//   const [roleDrafts, setRoleDrafts] = useState({});
//   // for showing loading on Assign button
//   const [assigningId, setAssigningId] = useState(null);

//   const fetchUsers = async () => {
//     try {
//       setLoadingUsers(true);
//       const res = await fetch(
//         `${API_BASE_URL}/approved-users-route/approved-users`
//       );
//       if (!res.ok) throw new Error("Failed to fetch approved users");

//       const data = await res.json();
//       setUsers(data);

//       // optional: initialize roleDrafts based on current roles
//       const initialDrafts = {};
//       data.forEach((u) => {
//         const r = (u.role || "").toLowerCase();
//         if (["warden", "admin", "security"].includes(r)) {
//           initialDrafts[u.id] = r;
//         }
//       });
//       setRoleDrafts(initialDrafts);
//     } catch (err) {
//       console.error(err);
//       notification.error({
//         message: "Unable to load users",
//         description:
//           err.message || "Something went wrong while fetching user accounts.",
//       });
//     } finally {
//       setLoadingUsers(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const handleAssignRole = async (userId, newRole) => {
//     if (!newRole) {
//       notification.error({
//         message: "Role required",
//         description: "Please select a role before assigning.",
//       });
//       return;
//     }

//     try {
//       setAssigningId(userId);
//       const res = await fetch(
//         `${API_BASE_URL}/approved-users-route/update-role/${userId}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ role: newRole }),
//         }
//       );

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Failed to update role");

//       notification.success({
//         message: "Role Assigned",
//         description: `User role updated to ${newRole.toUpperCase()}.`,
//       });

//       // reload to stay in sync with backend
//       fetchUsers();
//     } catch (err) {
//       console.error(err);
//       notification.error({
//         message: "Update failed",
//         description: err.message || "Could not update user role.",
//       });
//     } finally {
//       setAssigningId(null);
//     }
//   };

//   const userColumns = [
//     {
//       title: "Employee",
//       dataIndex: "employee_number",
//       key: "employee_number",
//       render: (emp, record) => (
//         <div className="rba-user-emp">
//           <Avatar className="rba-user-avatar">
//             {(record.email || record.domain_join_upn || "?")
//               .charAt(0)
//               .toUpperCase()}
//           </Avatar>
//           <div className="rba-user-emp-text">
//             <span className="rba-user-email-main">
//               {record.email || record.domain_join_upn}
//             </span>
//             <span className="rba-user-emp-sub">Emp No: {emp || "-"}</span>
//           </div>
//         </div>
//       ),
//     },
//     {
//       title: "Domain UPN",
//       dataIndex: "domain_join_upn",
//       key: "domain_join_upn",
//       render: (text) => (
//         <span className="rba-user-muted">{text || "-"}</span>
//       ),
//     },
//     {
//       title: "Domain",
//       dataIndex: "domain_to_join",
//       key: "domain_to_join",
//       render: (text) => (
//         <Tag color="blue" className="rba-tag-pill">
//           {text || "kggroup.com"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Role",
//       key: "role_assign",
//       render: (_, record) => {
//         const currentDraft =
//           roleDrafts[record.id] ||
//           (["warden", "admin", "security"].includes(
//             (record.role || "").toLowerCase()
//           )
//             ? (record.role || "").toLowerCase()
//             : undefined);

//         return (
//           <Space>
//             <Select
//               size="small"
//               className="rba-role-select"
//               style={{ minWidth: 130 }}
//               placeholder="Select Role"
//               value={currentDraft}
//               onChange={(val) =>
//                 setRoleDrafts((prev) => ({ ...prev, [record.id]: val }))
//               }
//             >
//               <Option value="warden">Warden</Option>
//               <Option value="admin">Admin</Option>
//               <Option value="security">Security</Option>
//             </Select>
//             <Button
//               size="small"
//               type="primary"
//               loading={assigningId === record.id}
//               disabled={!currentDraft}
//               onClick={() => handleAssignRole(record.id, currentDraft)}
//             >
//               Assign
//             </Button>
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Approved",
//       dataIndex: "approved_at",
//       key: "approved_at",
//       render: (val, record) =>
//         record.is_approved ? (
//           <Tooltip
//             title={
//               val
//                 ? new Date(val).toLocaleString("en-IN", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })
//                 : "Approved"
//             }
//           >
//             <Tag color="success" className="rba-tag-pill">
//               Approved
//             </Tag>
//           </Tooltip>
//         ) : (
//           <Tag color="warning" className="rba-tag-pill">
//             Pending
//           </Tag>
//         ),
//     },
//   ];

//   return (
//     <div className="role-based-access-container">
//       {/* Header */}
//       <div className="role-based-access-header">
//         <div>
//           <h2 className="role-based-access-title">Role Based Access</h2>
//           <p className="role-based-access-subtitle">
//             Configure high-level roles and manage which accounts have elevated access.
//           </p>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="role-based-access-tabs-wrap">
//         <Tabs
//           activeKey={activeTab}
//           onChange={setActiveTab}
//           className="role-based-access-tabs"
//         >
//           <TabPane tab="Roles" key="roles">
//             <div className="rba-roles-grid">
//               {ROLE_CARDS.map((role) => (
//                 <Card
//                   key={role.key}
//                   className={`rba-role-card ${role.accentClass}`}
//                   hoverable
//                 >
//                   <div className="rba-role-card-header">
//                     <div className="rba-role-icon-badge">{role.icon}</div>
//                     <div className="rba-role-title-block">
//                       <h3 className="rba-role-name">{role.name}</h3>
//                       <span className="rba-role-pill">{role.pill}</span>
//                     </div>
//                   </div>
//                   <p className="rba-role-description">{role.description}</p>
//                   <div className="rba-role-meta-row">
//                     <div className="rba-role-meta-dot" />
//                     <span className="rba-role-meta-text">
//                       Default permissions configured at system level.
//                     </span>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           </TabPane>

//           <TabPane tab="User Accounts" key="users">
//             <div className="rba-users-header-row">
//               <div>
//                 <h3 className="rba-users-title">Approved Users</h3>
//                 <p className="rba-users-subtitle">
//                   Assign elevated roles like Warden, Admin, or Security to approved accounts.
//                 </p>
//               </div>
//               <Button
//                 type="default"
//                 size="small"
//                 onClick={fetchUsers}
//                 className="rba-refresh-btn"
//               >
//                 <ReloadOutlined />
//                 Refresh
//               </Button>
//             </div>

//             <div className="rba-users-table-wrapper">
//               {loadingUsers ? (
//                 <div className="rba-users-loading">
//                   <Spin />
//                 </div>
//               ) : users && users.length > 0 ? (
//                 <Table
//                   rowKey="id"
//                   columns={userColumns}
//                   dataSource={users}
//                   pagination={{ pageSize: 10 }}
//                   className="rba-users-table"
//                 />
//               ) : (
//                 <div className="rba-users-empty">
//                   <Empty description="No approved user accounts found." />
//                 </div>
//               )}
//             </div>
//           </TabPane>
//         </Tabs>
//       </div>
//     </div>
//   );
// }

// export default RoleBasedAccess;
