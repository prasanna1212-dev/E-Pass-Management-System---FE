// src/pages/DepartmentMaster.jsx
import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import "../styles/DepartmentMaster.css";

const { Option } = Select;

function DepartmentMaster() {
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [filteredDegrees, setFilteredDegrees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [divisionFilter, setDivisionFilter] = useState(null);
  const [form] = Form.useForm();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchDivisions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/division-master-route/getinfo`);
      if (!res.ok) throw new Error("Failed to fetch divisions");
      const data = await res.json();
      setDivisions(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load divisions");
    }
  };

  const fetchDegrees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/degree-master-route/getinfo`);
      if (!res.ok) throw new Error("Failed to fetch degrees");
      const data = await res.json();
      setDegrees(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load degrees");
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/department-master-route/getinfo`
      );
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
    fetchDegrees();
    fetchDepartments();
  }, []);

  const filteredDepartments = React.useMemo(() => {
    if (!divisionFilter) return departments;
    return departments.filter(
      (dept) => dept.division_id === divisionFilter
    );
  }, [departments, divisionFilter]);


  const handleDivisionChange = (divisionId) => {
    form.setFieldsValue({ degreeId: undefined });
    const filtered = degrees.filter((deg) => deg.division_id === divisionId);
    setFilteredDegrees(filtered);
  };

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setFilteredDegrees([]);
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);

    const relatedDegrees = degrees.filter(
      (deg) => deg.division_id === record.division_id
    );
    setFilteredDegrees(relatedDegrees);

    form.setFieldsValue({
      divisionId: record.division_id,
      degreeId: record.degree_id,
      department: record.department_name,
    });

    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
    setFilteredDegrees([]);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalSubmitting(true);

      const payload = {
        divisionId: values.divisionId,
        degreeId: values.degreeId,
        department: values.department,
      };

      const isEdit = !!editingRecord;

      const url = isEdit
        ? `${API_BASE_URL}/department-master-route/updateinfo/${editingRecord.id}`
        : `${API_BASE_URL}/department-master-route/addinfo`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errRes = await res.json().catch(() => ({}));
        throw new Error(errRes.message || "Something went wrong");
      }

      message.success(isEdit ? "Department updated" : "Department created");
      handleModalCancel();
      fetchDepartments();
    } catch (err) {
      if (err?.errorFields) return; // form validation
      console.error(err);
      message.error(err.message || "Unable to save department");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/department-master-route/deleteinfo/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errRes = await res.json().catch(() => ({}));
        throw new Error(errRes.message || "Delete failed");
      }

      message.success("Department deleted");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Unable to delete department");
    }
  };

  const columns = [
    {
      title: "Division",
      dataIndex: "division_name",
      key: "division_name",
    },
    {
      title: "Degree",
      dataIndex: "degree_name",
      key: "degree_name",
    },
    {
      title: "Department",
      dataIndex: "department_name",
      key: "department_name",
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Delete department?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="masters-page">
      <div className="masters-header">
        <h2>Masters</h2>
        <p className="masters-subtitle">
          Manage configuration for department and other master data.
        </p>
      </div>

      <div className="masters-card">
        <div className="masters-card-header">
          <div>
            <h3>Department Masters</h3>
            <p className="masters-card-description">
              Maintain department records mapped with division and degree.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Select
              placeholder="Filter by division"
              allowClear
              style={{ minWidth: 200 }}
              value={divisionFilter}
              onChange={(value) => setDivisionFilter(value || null)}
            >
              {divisions.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              className="masters-add-btn"
            >
              Add
            </Button>
          </div>
        </div>

        <Table
          rowKey="id"
          dataSource={filteredDepartments}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        open={modalVisible}
        title={editingRecord ? "Edit Department" : "Add Department"}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        confirmLoading={modalSubmitting}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Division"
            name="divisionId"
            rules={[{ required: true, message: "Please select division" }]}
          >
            <Select
              placeholder="Select division"
              onChange={handleDivisionChange}
            >
              {divisions.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Degree"
            name="degreeId"
            rules={[{ required: true, message: "Please select degree" }]}
          >
            <Select placeholder="Select degree">
              {filteredDegrees.map((deg) => (
                <Option key={deg.id} value={deg.id}>
                  {deg.degree_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Department"
            name="department"
            rules={[
              { required: true, message: "Please enter department" },
              { max: 255, message: "Department is too long" },
            ]}
          >
            <Input placeholder="e.g. Computer Science, Finance, HR" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default DepartmentMaster;