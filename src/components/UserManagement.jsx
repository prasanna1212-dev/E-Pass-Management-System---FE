import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';
import "../styles/UserManagement.css";
const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [viewMode, setViewMode] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAssignDeviceModal, setShowAssignDeviceModal] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState(null);
  const [mappingView, setMappingView] = useState(false);

  // Mock data for users
  const users = [
    { id: 'U-2023-001', name: 'Alex Johnson', email: 'alex.johnson@company.com', role: 'Developer', department: 'Engineering', status: 'Active', joinDate: '2022-05-15', assignedDevices: 2, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520young%2520male%2520with%2520short%2520brown%2520hair%2520and%2520friendly%2520smile%2520on%2520plain%2520white%2520background%252C%2520business%2520casual%2520attire%252C%2520well-groomed%252C%2520natural%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=101&orientation=squarish' },
    { id: 'U-2023-002', name: 'Maya Patel', email: 'maya.patel@company.com', role: 'Marketing Specialist', department: 'Marketing', status: 'Active', joinDate: '2021-11-08', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520young%2520female%2520with%2520long%2520dark%2520hair%2520and%2520confident%2520expression%2520on%2520plain%2520white%2520background%252C%2520business%2520professional%2520attire%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=102&orientation=squarish' },
    { id: 'U-2023-003', name: 'Tom Wilson', email: 'tom.wilson@company.com', role: 'Financial Analyst', department: 'Finance', status: 'Active', joinDate: '2023-01-20', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520middle-aged%2520male%2520with%2520glasses%2520and%2520serious%2520expression%2520on%2520plain%2520white%2520background%252C%2520formal%2520business%2520attire%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=103&orientation=squarish' },
    { id: 'U-2023-004', name: 'Sophia Lee', email: 'sophia.lee@company.com', role: 'UI/UX Designer', department: 'Design', status: 'Active', joinDate: '2022-08-15', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520young%2520Asian%2520female%2520with%2520medium%2520length%2520hair%2520and%2520creative%2520style%2520on%2520plain%2520white%2520background%252C%2520business%2520casual%2520attire%252C%2520well-groomed%252C%2520natural%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=104&orientation=squarish' },
    { id: 'U-2023-005', name: 'James Rodriguez', email: 'james.rodriguez@company.com', role: 'Sales Manager', department: 'Sales', status: 'Active', joinDate: '2021-06-10', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520Hispanic%2520male%2520with%2520short%2520dark%2520hair%2520and%2520confident%2520smile%2520on%2520plain%2520white%2520background%252C%2520business%2520professional%2520attire%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=105&orientation=squarish' },
    { id: 'U-2023-006', name: 'Emma Thompson', email: 'emma.thompson@company.com', role: 'HR Specialist', department: 'HR', status: 'On Leave', joinDate: '2022-03-15', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520female%2520with%2520blonde%2520hair%2520and%2520warm%2520smile%2520on%2520plain%2520white%2520background%252C%2520business%2520professional%2520attire%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=106&orientation=squarish' },
    { id: 'U-2023-007', name: 'Michael Chen', email: 'michael.chen@company.com', role: 'Senior Developer', department: 'Engineering', status: 'Active', joinDate: '2020-11-05', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520an%2520Asian%2520male%2520with%2520glasses%2520and%2520friendly%2520expression%2520on%2520plain%2520white%2520background%252C%2520business%2520casual%2520attire%252C%2520well-groomed%252C%2520natural%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=107&orientation=squarish' },
    { id: 'U-2023-008', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Content Strategist', department: 'Marketing', status: 'Inactive', joinDate: '2022-02-20', assignedDevices: 0, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520female%2520with%2520brown%2520hair%2520and%2520thoughtful%2520expression%2520on%2520plain%2520white%2520background%252C%2520business%2520casual%2520attire%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=108&orientation=squarish' },
    { id: 'U-2023-009', name: 'David Wilson', email: 'david.wilson@company.com', role: 'IT Administrator', department: 'Admin', status: 'Active', joinDate: '2021-09-12', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520middle-aged%2520male%2520with%2520short%2520gray%2520hair%2520and%2520serious%2520expression%2520on%2520plain%2520white%2520background%252C%2520business%2520professional%2520attire%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=109&orientation=squarish' },
    { id: 'U-2023-010', name: 'Jessica Brown', email: 'jessica.brown@company.com', role: 'Graphic Designer', department: 'Design', status: 'Active', joinDate: '2022-07-08', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520female%2520with%2520curly%2520hair%2520and%2520creative%2520style%2520on%2520plain%2520white%2520background%252C%2520business%2520casual%2520attire%252C%2520well-groomed%252C%2520natural%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=110&orientation=squarish' },
    { id: 'U-2023-011', name: 'Robert Davis', email: 'robert.davis@company.com', role: 'Marketing Director', department: 'Marketing', status: 'Active', joinDate: '2019-04-15', assignedDevices: 1, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520an%2520older%2520male%2520with%2520gray%2520hair%2520and%2520confident%2520expression%2520on%2520plain%2520white%2520background%252C%2520business%2520formal%2520attire%2520with%2520tie%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=111&orientation=squarish' },
    { id: 'U-2023-012', name: 'Linda Martinez', email: 'linda.martinez@company.com', role: 'Sales Representative', department: 'Sales', status: 'Active', joinDate: '2022-10-01', assignedDevices: 0, image: 'https://readdy.ai/api/search-image?query=Professional%2520headshot%2520of%2520a%2520Hispanic%2520female%2520with%2520long%2520dark%2520hair%2520and%2520friendly%2520smile%2520on%2520plain%2520white%2520background%252C%2520business%2520professional%2520attire%252C%2520well-groomed%252C%2520studio%2520lighting%252C%2520high%2520quality%2520portrait%2520photography&width=100&height=100&seq=112&orientation=squarish' },
  ];

  // Mock data for devices
  const devices = [
    { id: 'D-2023-001', type: 'Laptop', model: 'MacBook Pro 16"', user: 'Alex Johnson', department: 'Engineering', status: 'Assigned', purchaseDate: '2023-01-15', specs: { processor: 'M1 Pro', ram: '16GB', storage: '512GB SSD', display: '16-inch Retina' }, image: 'https://readdy.ai/api/search-image?query=Professional%2520MacBook%2520Pro%2520laptop%2520with%2520sleek%2520design%2520on%2520a%2520minimalist%2520white%2520background%252C%2520high%2520resolution%2520product%2520photography%2520with%2520soft%2520shadows%252C%2520clean%2520and%2520modern%2520aesthetic%252C%2520detailed%2520texture%2520of%2520aluminum%2520body&width=400&height=300&seq=1&orientation=landscape' },
    { id: 'D-2023-002', type: 'Laptop', model: 'Dell XPS 15', user: 'Maya Patel', department: 'Marketing', status: 'Assigned', purchaseDate: '2023-02-10', specs: { processor: 'Intel i7-11800H', ram: '32GB', storage: '1TB SSD', display: '15.6-inch 4K' }, image: 'https://readdy.ai/api/search-image?query=Dell%2520XPS%252015%2520laptop%2520with%2520infinity%2520edge%2520display%2520on%2520clean%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520subtle%2520shadows%252C%2520showing%2520keyboard%2520and%2520ports%252C%2520premium%2520build%2520quality%2520visible&width=400&height=300&seq=2&orientation=landscape' },
    { id: 'D-2023-003', type: 'Desktop', model: 'HP EliteDesk 800', user: 'Tom Wilson', department: 'Finance', status: 'Assigned', purchaseDate: '2023-01-20', specs: { processor: 'Intel i5-10500', ram: '16GB', storage: '512GB SSD', graphics: 'Intel UHD 630' }, image: 'https://readdy.ai/api/search-image?query=HP%2520EliteDesk%2520800%2520desktop%2520computer%2520with%2520sleek%2520design%2520on%2520minimalist%2520white%2520background%252C%2520professional%2520product%2520photography%2520showing%2520front%2520and%2520side%2520views%252C%2520business-class%2520workstation%2520with%2520visible%2520ports&width=400&height=300&seq=3&orientation=landscape' },
    { id: 'D-2023-004', type: 'Monitor', model: 'LG 27UL850', user: 'Sophia Lee', department: 'Design', status: 'Assigned', purchaseDate: '2023-03-05', specs: { size: '27-inch', resolution: '4K UHD', refreshRate: '60Hz', ports: 'HDMI, DisplayPort, USB-C' }, image: 'https://readdy.ai/api/search-image?query=LG%252027-inch%25204K%2520monitor%2520with%2520thin%2520bezels%2520on%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520soft%2520lighting%252C%2520showing%2520display%2520and%2520stand%2520from%2520front%2520and%2520side%2520angles%252C%2520sleek%2520modern%2520design&width=400&height=300&seq=4&orientation=landscape' },
    { id: 'D-2023-005', type: 'Tablet', model: 'iPad Pro 12.9"', user: 'James Rodriguez', department: 'Sales', status: 'Assigned', purchaseDate: '2023-02-28', specs: { processor: 'M1', ram: '8GB', storage: '256GB', display: '12.9-inch Liquid Retina XDR' }, image: 'https://readdy.ai/api/search-image?query=iPad%2520Pro%252012.9-inch%2520with%2520sleek%2520design%2520on%2520minimalist%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520subtle%2520shadows%252C%2520showing%2520front%2520and%2520back%2520views%252C%2520premium%2520tablet%2520with%2520thin%2520bezels%2520and%2520metallic%2520finish&width=400&height=300&seq=5&orientation=landscape' },
    { id: 'D-2023-006', type: 'Laptop', model: 'ThinkPad X1 Carbon', user: 'Emma Thompson', department: 'HR', status: 'Assigned', purchaseDate: '2022-11-15', specs: { processor: 'Intel i7-1165G7', ram: '16GB', storage: '512GB SSD', display: '14-inch FHD+' }, image: 'https://readdy.ai/api/search-image?query=ThinkPad%2520X1%2520Carbon%2520laptop%2520with%2520classic%2520black%2520design%2520on%2520minimalist%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520subtle%2520lighting%252C%2520showing%2520keyboard%2520with%2520red%2520trackpoint%2520and%2520slim%2520profile%252C%2520business-class%2520device&width=400&height=300&seq=6&orientation=landscape' },
    { id: 'D-2023-007', type: 'Smartphone', model: 'iPhone 14 Pro', user: 'Michael Chen', department: 'Engineering', status: 'Assigned', purchaseDate: '2023-04-10', specs: { processor: 'A16 Bionic', ram: '6GB', storage: '256GB', display: '6.1-inch Super Retina XDR' }, image: 'https://readdy.ai/api/search-image?query=iPhone%252014%2520Pro%2520with%2520dynamic%2520island%2520on%2520clean%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520subtle%2520shadows%252C%2520showing%2520front%2520and%2520back%2520views%252C%2520premium%2520smartphone%2520with%2520metallic%2520edges%2520and%2520camera%2520system&width=400&height=300&seq=7&orientation=landscape' },
    { id: 'D-2023-008', type: 'Laptop', model: 'Surface Laptop 4', user: '', department: '', status: 'Available', purchaseDate: '2023-03-20', specs: { processor: 'AMD Ryzen 7', ram: '16GB', storage: '512GB SSD', display: '15-inch PixelSense' }, image: 'https://readdy.ai/api/search-image?query=Microsoft%2520Surface%2520Laptop%25204%2520with%2520alcantara%2520keyboard%2520on%2520minimalist%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520soft%2520lighting%252C%2520showing%2520slim%2520profile%2520and%2520touchscreen%2520display%252C%2520premium%2520ultrabook%2520design&width=400&height=300&seq=8&orientation=landscape' },
    { id: 'D-2023-009', type: 'Printer', model: 'HP LaserJet Pro M404dn', user: 'David Wilson', department: 'Admin', status: 'Assigned', purchaseDate: '2023-01-30', specs: { type: 'Laser', printSpeed: '40 ppm', connectivity: 'Ethernet, USB', duplexPrinting: 'Yes' }, image: 'https://readdy.ai/api/search-image?query=HP%2520LaserJet%2520Pro%2520printer%2520with%2520professional%2520design%2520on%2520clean%2520white%2520background%252C%2520product%2520photography%2520with%2520subtle%2520shadows%252C%2520showing%2520paper%2520tray%2520and%2520control%2520panel%252C%2520office%2520equipment%2520with%2520clean%2520lines&width=400&height=300&seq=9&orientation=landscape' },
    { id: 'D-2023-010', type: 'Monitor', model: 'Dell UltraSharp U2720Q', user: 'Jessica Brown', department: 'Design', status: 'Assigned', purchaseDate: '2023-02-15', specs: { size: '27-inch', resolution: '4K UHD', refreshRate: '60Hz', ports: 'HDMI, DisplayPort, USB-C' }, image: 'https://readdy.ai/api/search-image?query=Dell%2520UltraSharp%2520monitor%2520with%2520InfinityEdge%2520design%2520on%2520minimalist%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520soft%2520lighting%252C%2520showing%2520display%2520and%2520adjustable%2520stand%252C%2520premium%2520monitor%2520with%2520thin%2520bezels&width=400&height=300&seq=10&orientation=landscape' },
    { id: 'D-2023-011', type: 'Laptop', model: 'Asus ROG Zephyrus G14', user: '', department: '', status: 'Available', purchaseDate: '2023-05-05', specs: { processor: 'AMD Ryzen 9', ram: '32GB', storage: '1TB SSD', display: '14-inch QHD', graphics: 'NVIDIA RTX 3060' }, image: 'https://readdy.ai/api/search-image?query=Asus%2520ROG%2520Zephyrus%2520gaming%2520laptop%2520with%2520RGB%2520keyboard%2520on%2520minimalist%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520dramatic%2520lighting%252C%2520showing%2520slim%2520gaming%2520design%2520and%2520cooling%2520vents%252C%2520premium%2520portable%2520gaming%2520machine&width=400&height=300&seq=11&orientation=landscape' },
    { id: 'D-2023-012', type: 'Desktop', model: 'iMac 24"', user: 'Robert Davis', department: 'Marketing', status: 'Assigned', purchaseDate: '2023-04-20', specs: { processor: 'M1', ram: '16GB', storage: '512GB SSD', display: '24-inch 4.5K Retina' }, image: 'https://readdy.ai/api/search-image?query=Apple%2520iMac%252024-inch%2520with%2520colorful%2520design%2520on%2520minimalist%2520white%2520background%252C%2520professional%2520product%2520photography%2520with%2520subtle%2520shadows%252C%2520showing%2520slim%2520all-in-one%2520computer%2520with%2520matching%2520keyboard%2520and%2520mouse%252C%2520modern%2520desktop%2520setup&width=400&height=300&seq=12&orientation=landscape' },
  ];

  const availableDevices = devices.filter(device => device.status === 'Available');

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All Roles' || user.role.includes(roleFilter);
    const matchesStatus = statusFilter === 'All Statuses' || user.status === statusFilter;
    const matchesDepartment = departmentFilter === 'All Departments' || user.department === departmentFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Inactive': return 'status-inactive';
      case 'On Leave': return 'status-onleave';
      case 'Suspended': return 'status-suspended';
      default: return 'status-default';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('All Roles');
    setStatusFilter('All Statuses');
    setDepartmentFilter('All Departments');
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      const userDistributionChart = echarts.init(document.getElementById('user-distribution-chart'));
      userDistributionChart.setOption({
        animation: false,
        tooltip: { trigger: 'item' },
        legend: { top: '5%', left: 'center' },
        series: [{
          name: 'Department Distribution',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          labelLine: { show: false },
          data: [
            { value: 3, name: 'Engineering' },
            { value: 3, name: 'Marketing' },
            { value: 2, name: 'Design' },
            { value: 2, name: 'Sales' },
            { value: 1, name: 'Finance' },
            { value: 1, name: 'HR' },
            { value: 1, name: 'Admin' }
          ]
        }]
      });

      const deviceAssignmentChart = echarts.init(document.getElementById('device-assignment-chart'));
      deviceAssignmentChart.setOption({
        animation: false,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: [{ type: 'category', data: ['Engineering', 'Marketing', 'Design', 'Sales', 'Finance', 'HR', 'Admin'], axisTick: { alignWithLabel: true } }],
        yAxis: [{ type: 'value' }],
        series: [{ name: 'Assigned Devices', type: 'bar', barWidth: '60%', data: [3, 3, 2, 1, 1, 1, 1] }]
      });

      const handleResize = () => {
        userDistributionChart.resize();
        deviceAssignmentChart.resize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        userDistributionChart.dispose();
        deviceAssignmentChart.dispose();
      };
    }
  }, [activeTab]);

  const getUserDevices = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    return devices.filter(device => device.user === user.name && device.department === user.department);
  };

  return (
    <div className="user-management-app-container">
{/* 
    
      <div className="user-management-breadcrumb-bar">
        <div className="user-management-breadcrumb-content">
          <a href="#" className="user-management-breadcrumb-link">Dashboard</a>
          <span className="user-management-breadcrumb-separator">/</span>
          <span className="user-management-breadcrumb-current">User Management</span>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="user-management-main-layout">
       

        {/* Main Content Area */}
        <div className="user-management-content-area">
          <div className="user-management-content-header">
            <div>
              <h1 className="user-management-content-title">User Management</h1>
           
            </div>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="user-management-btn-primary btn-add-user"
            >
              <i className="fas fa-user-plus"></i>
              <span>Add New User</span>
            </button>
          </div>

          {/* View Tabs */}
          <div className="user-management-tabs-bar">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`user-management-tab-button ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`user-management-tab-button ${activeTab === 'users' ? 'tab-active' : ''}`}
            >
              User List
            </button>
            <button
              onClick={() => setActiveTab('mapping')}
              className={`user-management-tab-button ${activeTab === 'mapping' ? 'tab-active' : ''}`}
            >
              Device Mapping
            </button>
          </div>

          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Overview Cards */}
              <div className="user-management-overview-cards">
                <div className="user-management-card card-total-users">
                  <div className="user-management-card-header">
                    <div>
                      <p className="user-management-card-label">Total Users</p>
                      <h3 className="user-management-card-value">12</h3>
                    </div>
                    <div className="user-management-card-icon bg-blue-light">
                      <i className="fas fa-users icon-blue"></i>
                    </div>
                  </div>
                  <div className="user-management-card-footer">
                    <span className="user-management-stat-positive"><i className="fas fa-arrow-up"></i> 8%</span>
                    <span className="user-management-stat-text">from last month</span>
                  </div>
                </div>

                <div className="user-management-card card-active-users">
                  <div className="user-management-card-header">
                    <div>
                      <p className="user-management-card-label">Active Users</p>
                      <h3 className="user-management-card-value">10</h3>
                    </div>
                    <div className="user-management-card-icon bg-green-light">
                      <i className="fas fa-user-check icon-green"></i>
                    </div>
                  </div>
                  <div className="user-management-card-footer">
                    <span className="user-management-stat-positive"><i className="fas fa-arrow-up"></i> 5%</span>
                    <span className="user-management-stat-text">from last month</span>
                  </div>
                </div>

                <div className="user-management-card card-assigned-devices">
                  <div className="user-management-card-header">
                    <div>
                      <p className="user-management-card-label">Assigned Devices</p>
                      <h3 className="user-management-card-value">10</h3>
                    </div>
                    <div className="user-management-card-icon bg-purple-light">
                      <i className="fas fa-laptop icon-purple"></i>
                    </div>
                  </div>
                  <div className="user-management-card-footer">
                    <span className="user-management-stat-positive"><i className="fas fa-arrow-up"></i> 12%</span>
                    <span className="user-management-stat-text">from last month</span>
                  </div>
                </div>

                <div className="user-management-card card-device-utilization">
                  <div className="user-management-card-header">
                    <div>
                      <p className="user-management-card-label">Device Utilization</p>
                      <h3 className="user-management-card-value">83%</h3>
                    </div>
                    <div className="user-management-card-icon bg-orange-light">
                      <i className="fas fa-chart-pie icon-orange"></i>
                    </div>
                  </div>
                  <div className="user-management-card-footer">
                    <span className="user-management-stat-negative"><i className="fas fa-arrow-down"></i> 3%</span>
                    <span className="user-management-stat-text">from last month</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="user-management-charts-grid">
                <div className="user-management-chart-card">
                  <h3 className="user-management-chart-title">User Department Distribution</h3>
                  <div id="user-distribution-chart" className="user-management-chart-container"></div>
                </div>

                <div className="user-management-chart-card">
                  <h3 className="user-management-chart-title">Device Assignment by Department</h3>
                  <div id="device-assignment-chart" className="user-management-chart-container"></div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="user-management-recent-activity-card">
                <div className="user-management-recent-activity-header">
                  <h3>Recent User Activity</h3>
                </div>
                <div className="user-management-recent-activity-table-wrapper">
                  <table className="user-management-recent-activity-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Activity</th>
                        <th>Device</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="user-management-user-info-row">
                            <img src={users[0].image} alt={users[0].name} className="user-management-user-avatar-small" />
                            <div>
                              <div className="user-management-user-name-small">{users[0].name}</div>
                              <div className="user-management-user-department-small">{users[0].department}</div>
                            </div>
                          </div>
                        </td>
                        <td>Device assigned</td>
                        <td>MacBook Pro 16"</td>
                        <td>July 1, 2025</td>
                      </tr>
                      <tr>
                        <td>
                          <div className="user-management-user-info-row">
                            <img src={users[5].image} alt={users[5].name} className="user-management-user-avatar-small" />
                            <div>
                              <div className="user-management-user-name-small">{users[5].name}</div>
                              <div className="user-management-user-department-small">{users[5].department}</div>
                            </div>
                          </div>
                        </td>
                        <td>Status changed to On Leave</td>
                        <td>-</td>
                        <td>June 30, 2025</td>
                      </tr>
                      <tr>
                        <td>
                          <div className="user-management-user-info-row">
                            <img src={users[3].image} alt={users[3].name} className="user-management-user-avatar-small" />
                            <div>
                              <div className="user-management-user-name-small">{users[3].name}</div>
                              <div className="user-management-user-department-small">{users[3].department}</div>
                            </div>
                          </div>
                        </td>
                        <td>Profile updated</td>
                        <td>-</td>
                        <td>June 28, 2025</td>
                      </tr>
                      <tr>
                        <td>
                          <div className="user-management-user-info-row">
                            <img src={users[7].image} alt={users[7].name} className="user-management-user-avatar-small" />
                            <div>
                              <div className="user-management-user-name-small">{users[7].name}</div>
                              <div className="user-management-user-department-small">{users[7].department}</div>
                            </div>
                          </div>
                        </td>
                        <td>Status changed to Inactive</td>
                        <td>-</td>
                        <td>June 25, 2025</td>
                      </tr>
                      <tr>
                        <td>
                          <div className="user-management-user-info-row">
                            <img src={users[1].image} alt={users[1].name} className="user-management-user-avatar-small" />
                            <div>
                              <div className="user-management-user-name-small">{users[1].name}</div>
                              <div className="user-management-user-department-small">{users[1].department}</div>
                            </div>
                          </div>
                        </td>
                        <td>Device assigned</td>
                        <td>Dell XPS 15</td>
                        <td>June 22, 2025</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users List View */}
          {activeTab === 'users' && (
            <div>
              {/* Filters */}
              <div className="user-management-filters-bar">
                <div className="user-management-filter-search">
                  <input
                    type="text"
                    placeholder="Search users by name, email, role..."
                    className="user-management-input-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="fas fa-search search-icon"></i>
                </div>

                <div className="user-management-filter-dropdown">
                  <button className="user-management-dropdown-button">{roleFilter} <i className="fas fa-chevron-down"></i></button>
                  <div className="user-management-dropdown-menu">
                    <div onClick={() => setRoleFilter('All Roles')}>All Roles</div>
                    <div onClick={() => setRoleFilter('Developer')}>Developer</div>
                    <div onClick={() => setRoleFilter('Designer')}>Designer</div>
                    <div onClick={() => setRoleFilter('Marketing')}>Marketing</div>
                    <div onClick={() => setRoleFilter('Sales')}>Sales</div>
                    <div onClick={() => setRoleFilter('HR')}>HR</div>
                    <div onClick={() => setRoleFilter('Finance')}>Finance</div>
                  </div>
                </div>

                <div className="user-management-filter-dropdown">
                  <button className="user-management-dropdown-button">{statusFilter} <i className="fas fa-chevron-down"></i></button>
                  <div className="user-management-dropdown-menu">
                    <div onClick={() => setStatusFilter('All Statuses')}>All Statuses</div>
                    <div onClick={() => setStatusFilter('Active')}>Active</div>
                    <div onClick={() => setStatusFilter('Inactive')}>Inactive</div>
                    <div onClick={() => setStatusFilter('On Leave')}>On Leave</div>
                  </div>
                </div>

                <div className="user-management-filter-dropdown">
                  <button className="user-management-dropdown-button">{departmentFilter} <i className="user-management-fas fa-chevron-down"></i></button>
                  <div className="user-management-dropdown-menu">
                    <div onClick={() => setDepartmentFilter('All Departments')}>All Departments</div>
                    <div onClick={() => setDepartmentFilter('Engineering')}>Engineering</div>
                    <div onClick={() => setDepartmentFilter('Marketing')}>Marketing</div>
                    <div onClick={() => setDepartmentFilter('Design')}>Design</div>
                    <div onClick={() => setDepartmentFilter('Sales')}>Sales</div>
                    <div onClick={() => setDepartmentFilter('Finance')}>Finance</div>
                    <div onClick={() => setDepartmentFilter('HR')}>HR</div>
                    <div onClick={() => setDepartmentFilter('Admin')}>Admin</div>
                  </div>
                </div>

                <button onClick={clearFilters} className="user-management-btn-clear-filters">
                  <i className="fas fa-times-circle"></i> Clear Filters
                </button>

                <div className="user-management-view-mode-buttons">
                  <button onClick={() => setViewMode('grid')} className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`}><i className="fas fa-th-large"></i></button>
                  <button onClick={() => setViewMode('list')} className={`btn-view ${viewMode === 'list' ? 'active' : ''}`}><i className="fas fa-list"></i></button>
                </div>
              </div>

              {/* User Grid View */}
              {viewMode === 'grid' && (
                <div className="user-management-user-grid">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="user-management-user-card" onClick={() => setSelectedUser(user.id)}>
                      <div className="user-management-user-card-header">
                        <div className="user-management-user-avatar-large">
                          <img src={user.image} alt={user.name} />
                        </div>
                        <div className="user-management-user-info">
                          <h3>{user.name}</h3>
                          <p>{user.role}</p>
                        </div>
                        <span className={`user-status ${getStatusClass(user.status)}`}>{user.status}</span>
                      </div>
                      <div className="user-management-user-card-body">
                        <div className="user-management-user-contact"><i className="user-management-fas fa-envelope"></i> {user.email}</div>
                        <div className="user-management-user-department"><i className="user-management-fas fa-building"></i> {user.department}</div>
                        <div className="user-management-user-devices"><i className="user-management-fas fa-laptop"></i> {user.assignedDevices} devices assigned</div>
                      </div>
                      <div className="user-management-user-card-footer">
                        <span>ID: {user.id}</span>
                        <button onClick={e => { e.stopPropagation(); setSelectedUser(user.id); }} className="user-management-btn-details">Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User List View */}
              {viewMode === 'list' && (
                <div className="user-management-user-list-table-wrapper">
                  <table className="user-management-user-list-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Devices</th>
                        <th>Join Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="user-management-user-list-row">
                          <td>
                            <div className="user-management-user-info-row">
                              <img src={user.image} alt={user.name} className="user-management-user-avatar-small" />
                              <div>
                                <div className="user-management-user-name-small">{user.name}</div>
                                <div className="user-management-user-email-small">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{user.role}</td>
                          <td>{user.department}</td>
                          <td><span className={`user-status ${getStatusClass(user.status)}`}>{user.status}</span></td>
                          <td>{user.assignedDevices}</td>
                          <td>{user.joinDate}</td>
                          <td>
                            <div className="user-management-action-buttons">
                              <button onClick={() => { setSelectedUserForAssignment(user.id); setShowAssignDeviceModal(true); }}><i className="fas fa-laptop"></i></button>
                              <button><i className="fas fa-edit"></i></button>
                              <button onClick={() => setSelectedUser(user.id)}><i className="fas fa-external-link-alt"></i></button>
                              <button><i className="fas fa-ellipsis-v"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && (
                    <div className="user-management-no-users-found">
                      <i className="fas fa-users icon-large"></i>
                      <h3>No users found</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="user-management-pagination-bar">
                  <div className="user-management-pagination-info">
                    Showing <span>{1}</span> to <span>{filteredUsers.length}</span> of <span>{users.length}</span> users
                  </div>
                  <div className="user-management-pagination-controls">
                    <button disabled className="user-management-pagination-button disabled"><i className="fas fa-chevron-left"></i></button>
                    <button className="user-management-pagination-button active">1</button>
                    <button className="user-management-pagination-button"><i className="fas fa-chevron-right"></i></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Device Mapping View */}
          {activeTab === 'mapping' && (
            <div>
              <div className="user-management-mapping-filters">
                <div className="user-management-filter-search">
                  <input
                    type="text"
                    placeholder="Search users or devices..."
                    className="user-management-input-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="fas fa-search search-icon"></i>
                </div>

                <div className="user-management-mapping-view-buttons">
                  <button
                    onClick={() => setMappingView(false)}
                    className={`btn-mapping-view ${!mappingView ? 'active' : ''}`}
                  >
                    <i className="user-management-fas fa-th-list"></i> List View
                  </button>
                  <button
                    onClick={() => setMappingView(true)}
                    className={`btn-mapping-view ${mappingView ? 'active' : ''}`}
                  >
                    <i className="user-management-fas fa-project-diagram"></i> Matrix View
                  </button>
                </div>
              </div>

              {/* List Mapping View */}
              {!mappingView && (
                <div className="user-management-mapping-list-table-wrapper">
                  <div className="user-management-mapping-list-header">
                    <h3>User-Device Assignments</h3>
                  </div>
                  <table className="user-management-mapping-list-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Department</th>
                        <th>Device</th>
                        <th>Type</th>
                        <th>Assignment Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.filter(device => device.status === 'Assigned').map(device => {
                        const assignedUser = users.find(user => user.name === device.user && user.department === device.department);
                        return (
                          <tr key={device.id} className="user-management-mapping-list-row">
                            <td>
                              {assignedUser && (
                                <div className="user-management-user-info-row">
                                  <img src={assignedUser.image} alt={assignedUser.name} className="user-management-user-avatar-small" />
                                  <div>
                                    <div className="user-management-user-name-small">{assignedUser.name}</div>
                                    <div className="user-management-user-email-small">{assignedUser.email}</div>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td>{device.department}</td>
                            <td>
                              <div className="user-management-device-info">
                                <img src={device.image} alt={device.model} className="user-management-device-image" />
                                <div>
                                  <div className="user-management-device-model">{device.model}</div>
                                  <div className="user-management-device-id">ID: {device.id}</div>
                                </div>
                              </div>
                            </td>
                            <td>{device.type}</td>
                            <td>{device.purchaseDate}</td>
                            <td>
                              <div className="user-management-action-buttons">
                                <button className="user-management-btn-unlink"><i className="fas fa-unlink"></i></button>
                                <button className="user-management-btn-history"><i className="fas fa-history"></i></button>
                                <button className="user-management-btn-more"><i className="fas fa-ellipsis-v"></i></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Matrix Mapping View */}
              {mappingView && (
                <div className="user-management-mapping-matrix-wrapper">
                  <div className="user-management-mapping-matrix-header">
                    <h3>User-Device Matrix</h3>
                    <p>View and manage device assignments across departments</p>
                  </div>

                  <div className="user-management-mapping-matrix-panels">
                    {/* Available Users Panel */}
                    <div className="user-management-panel users-panel">
                      <div className="user-management-panel-header">Available Users</div>
                      <div className="user-management-panel-content">
                        {users.filter(user => user.status === 'Active').map(user => (
                          <div key={user.id} className="user-management-user-list-item">
                            <div className="user-management-user-info-row">
                              <img src={user.image} alt={user.name} className="user-management-user-avatar-small" />
                              <div>
                                <div className="user-management-user-name-small">{user.name}</div>
                                <div className="user-management-user-meta">{user.department} • {user.role}</div>
                              </div>
                            </div>
                            <div className="user-management-user-devices-count">{user.assignedDevices} devices</div>
                            <button 
                              className="user-management-btn-add-device"
                              onClick={() => {
                                setSelectedUserForAssignment(user.id);
                                setShowAssignDeviceModal(true);
                              }}
                            >
                              <i className="fas fa-plus-circle"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Available Devices Panel */}
                    <div className="user-management-panel devices-panel">
                      <div className="user-management-panel-header">Available Devices</div>
                      <div className="user-management-panel-content">
                        {availableDevices.map(device => (
                          <div key={device.id} className="user-management-device-list-item">
                            <div className="user-management-device-info">
                              <img src={device.image} alt={device.model} className="user-management-device-image" />
                              <div>
                                <div className="user-management-device-model">{device.model}</div>
                                <div className="user-management-device-meta">{device.type} • ID: {device.id}</div>
                              </div>
                            </div>
                            <span className="user-management-device-available-label">Available</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Mapping Section */}
                  <div className="user-management-department-device-distribution">
                    <div className="user-management-section-header">Department Device Distribution</div>
                    <div className="user-management-table-wrapper">
                      <table className="user-management-distribution-table">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Users</th>
                            <th>Laptops</th>
                            <th>Desktops</th>
                            <th>Monitors</th>
                            <th>Other Devices</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>Engineering</td><td>3</td><td>2</td><td>0</td><td>0</td><td>1</td><td>3</td></tr>
                          <tr><td>Marketing</td><td>3</td><td>2</td><td>1</td><td>0</td><td>0</td><td>3</td></tr>
                          <tr><td>Design</td><td>2</td><td>0</td><td>0</td><td>2</td><td>0</td><td>2</td></tr>
                          <tr><td>Sales</td><td>2</td><td>0</td><td>0</td><td>0</td><td>1</td><td>1</td></tr>
                          <tr><td>Finance</td><td>1</td><td>0</td><td>1</td><td>0</td><td>0</td><td>1</td></tr>
                          <tr><td>HR</td><td>1</td><td>1</td><td>0</td><td>0</td><td>0</td><td>1</td></tr>
                          <tr><td>Admin</td><td>1</td><td>0</td><td>0</td><td>0</td><td>1</td><td>1</td></tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>Total</td>
                            <td>13</td>
                            <td>5</td>
                            <td>2</td>
                            <td>2</td>
                            <td>3</td>
                            <td>12</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Detail Modal */}
          {selectedUser && (
            <div className="user-management-modal-overlay">
              <div className="user-management-modal-content large-modal">
                <div className="user-management-modal-header">
                  <h2>User Details</h2>
                  <button onClick={() => setSelectedUser(null)} className="user-management-modal-close-btn"><i className="fas fa-times"></i></button>
                </div>

                {(() => {
                  const user = users.find(u => u.id === selectedUser);
                  if (!user) return null;
                  const userDevices = getUserDevices(user.id);

                  return (
                    <div className="user-management-modal-body">
                      <div className="user-management-user-detail-main">
                        <div className="user-management-user-detail-left">
                          <div className="user-management-user-avatar-large">
                            <img src={user.image} alt={user.name} />
                          </div>
                          <h3>{user.name}</h3>
                          <p>{user.role}</p>
                          <span className={`user-status ${getStatusClass(user.status)}`}>{user.status}</span>

                          <div className="user-management-user-contact-info">
                            <div><i className="user-management-fas fa-envelope"></i> {user.email}</div>
                            <div><i className="user-management-fas fa-building"></i> {user.department}</div>
                            <div><i className="user-management-fas fa-calendar-alt"></i> Joined: {user.joinDate}</div>
                            <div><i className="user-management-fas fa-laptop"></i> {user.assignedDevices} devices assigned</div>
                          </div>
                        </div>

                        <div className="user-management-user-detail-right">
                          <h4>Assigned Devices</h4>
                          {userDevices.length > 0 ? (
                            userDevices.map(device => (
                              <div key={device.id} className="user-management-device-card">
                                <img src={device.image} alt={device.model} className="user-management-device-image-large" />
                                <div className="user-management-device-info">
                                    <div className='user-management-device-info-top'>
                                        <div className='user-management-device-info-top-left'>
                                  <h5>{device.model}</h5>
                                  <p>{device.type} • ID: {device.id}</p>
                                  </div>
                                  <span className="user-management-device-assigned-label">Assigned</span>
                                  </div>
                                  <div className="user-management-device-specs">
                                    {device.specs.processor && <div><i className="fas fa-microchip"></i> {device.specs.processor}</div>}
                                    {device.specs.ram && <div><i className="fas fa-memory"></i> {device.specs.ram}</div>}
                                    {device.specs.storage && <div><i className="fas fa-hdd"></i> {device.specs.storage}</div>}
                                    {device.specs.display && <div><i className="fas fa-desktop"></i> {device.specs.display}</div>}
                                  </div>
                                  <button className="user-management-btn-unassign"><i className="fas fa-unlink"></i> Unassign</button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="user-management-no-devices-assigned">
                              <i className="user-management-fas fa-laptop icon-large"></i>
                              <h3>No devices assigned</h3>
                              <p>This user doesn't have any devices assigned yet</p>
                              <button onClick={() => { setShowAssignDeviceModal(true); setSelectedUserForAssignment(user.id); }} className="user-management-btn-primary">
                                <i className="fas fa-plus-circle"></i> Assign Device
                              </button>
                            </div>
                          )}

                          <h4>Activity History</h4>
                          <div className="user-management-activity-history">
                            <div className="user-management-activity-item">
                              <div className="user-management-activity-header"><span className="user-management-activity-dot blue"></span> Device assigned - July 1, 2025</div>
                              <p>Assigned MacBook Pro 16" (D-2023-001)</p>
                            </div>
                            <div className="user-management-activity-item">
                              <div className="user-management-activity-header"><span className="user-management-activity-dot green"></span> Status updated - June 15, 2025</div>
                              <p>Status changed from "On Leave" to "Active"</p>
                            </div>
                            <div className="user-management-activity-item">
                              <div className="user-management-activity-header"><span className="user-management-activity-dot yellow"></span> Status updated - June 1, 2025</div>
                              <p>Status changed from "Active" to "On Leave"</p>
                            </div>
                            <div className="user-management-activity-item">
                              <div className="user-management-activity-header"><span className="user-management-activity-dot purple"></span> Profile updated - May 20, 2025</div>
                              <p>Updated role from "Junior Developer" to "Developer"</p>
                            </div>
                            <div className="user-management-activity-item">
                              <div className="user-management-activity-header"><span className="user-management-activity-dot gray"></span> User created - {user.joinDate}</div>
                              <p>User account created and added to the system</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="user-management-modal-footer">
                        <button onClick={() => { setShowAssignDeviceModal(true); setSelectedUserForAssignment(user.id); }} className="user-management-btn-primary">
                          <i className="fas fa-laptop"></i> Assign Device
                        </button>
                        <button className="user-management-btn-primary">
                          <i className="fas fa-edit"></i> Edit User
                        </button>
                        <button onClick={() => setSelectedUser(null)} className="user-management-btn-secondary">Close</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="user-management-modal-overlay">
              <div className="user-management-modal-content user-management-medium-modal">
                <div className="user-management-modal-header">
                  <h2>Add New User</h2>
                  <button onClick={() => setShowAddUserModal(false)} className="user-management-modal-close-btn"><i className="fas fa-times"></i></button>
                </div>

                <div className="user-management-modal-body">
                  <div className="user-management-form-grid">
                    <div className="user-management-form-group">
                      <label>First Name</label>
                      <input type="text" placeholder="Enter first name" className="user-management-form-input" />
                    </div>
                    <div className="user-management-form-group">
                      <label>Last Name</label>
                      <input type="text" placeholder="Enter last name" className="user-management-form-input" />
                    </div>
                    <div className="user-management-form-group">
                      <label>Email Address</label>
                      <input type="email" placeholder="Enter email address" className="user-management-form-input" />
                    </div>
                    <div className="user-management-form-group">
                      <label>Phone Number</label>
                      <input type="tel" placeholder="Enter phone number" className="user-management-form-input" />
                    </div>
                    <div className="user-management-form-group">
                      <label>Department</label>
                      <select className="user-management-form-select">
                        <option value="">Select department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Design">Design</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                        <option value="HR">HR</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div className="user-management-form-group">
                      <label>Role</label>
                      <select className="user-management-form-select">
                        <option value="">Select role</option>
                        <option value="Developer">Developer</option>
                        <option value="Designer">Designer</option>
                        <option value="Marketing Specialist">Marketing Specialist</option>
                        <option value="Sales Representative">Sales Representative</option>
                        <option value="Financial Analyst">Financial Analyst</option>
                        <option value="HR Specialist">HR Specialist</option>
                        <option value="IT Administrator">IT Administrator</option>
                      </select>
                    </div>
                    <div className="user-management-form-group">
                      <label>Status</label>
                      <select className="user-management-form-select">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                    <div className="user-management-form-group">
                      <label>Join Date</label>
                      <input type="date" className="user-management-form-input" />
                    </div>
                  </div>

                  <div className="user-management-form-group">
                    <label>Additional Notes</label>
                    <textarea rows={3} placeholder="Enter any additional information about the user" className="user-management-form-textarea"></textarea>
                  </div>
                </div>

                <div className="user-management-modal-footer">
                  <button className="user-management-btn-primary"><i className="fas fa-save"></i> Save User</button>
                  <button onClick={() => setShowAddUserModal(false)} className="user-management-btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Assign Device Modal */}
          {showAssignDeviceModal && (
            <div className="user-management-modal-overlay">
              <div className="user-management-modal-content user-management-medium-modal">
                <div className="user-management-modal-header">
                  <h2>Assign Device to User</h2>
                  <button onClick={() => setShowAssignDeviceModal(false)} className="user-management-modal-close-btn"><i className="fas fa-times"></i></button>
                </div>

                <div className="user-management-modal-body">
                  {selectedUserForAssignment && (
                    <div className="user-management-selected-user-info">
                      <label>Selected User</label>
                      <div className="user-management-user-info-row user-info-selected">
                        <img 
                          src={users.find(u => u.id === selectedUserForAssignment)?.image} 
                          alt={users.find(u => u.id === selectedUserForAssignment)?.name} 
                          className="user-management-user-avatar-small" 
                        />
                        <div>
                          <div className="user-management-user-name-small">
                            {users.find(u => u.id === selectedUserForAssignment)?.name}
                          </div>
                          <div className="user-management-user-meta">
                            {users.find(u => u.id === selectedUserForAssignment)?.department} • 
                            {users.find(u => u.id === selectedUserForAssignment)?.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="user-management-form-group">
                    <label>Select Device</label>
                    <select className="user-management-form-select">
                      <option value="">Select a device to assign</option>
                      {availableDevices.map(device => (
                        <option key={device.id} value={device.id}>
                          {device.model} ({device.type}) - ID: {device.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="user-management-form-grid">
                    <div className="user-management-form-group">
                      <label>Assignment Date</label>
                      <input type="date" defaultValue="2025-07-01" className="user-management-form-input" />
                    </div>
                    <div className="user-management-form-group">
                      <label>Return Date (Optional)</label>
                      <input type="date" className="user-management-form-input" />
                    </div>
                    <div className="user-management-form-group full-width">
                      <label>Assignment Reason</label>
                      <textarea rows={3} placeholder="Enter the reason for this device assignment" className="user-management-form-textarea"></textarea>
                    </div>
                  </div>
                </div>

                <div className="user-management-modal-footer">
                  <button className="user-management-btn-primary"><i className="user-management-fas fa-check"></i> Confirm Assignment</button>
                  <button onClick={() => setShowAssignDeviceModal(false)} className="user-management-btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;