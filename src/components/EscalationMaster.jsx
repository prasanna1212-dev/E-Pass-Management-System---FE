import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Space, Popconfirm, notification } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import "../styles/EscalationMaster.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function EscalationMaster() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [form] = Form.useForm();

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/escalation-masters/getinfo`);
      if (!res.ok) throw new Error("Failed to fetch escalation masters");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Fetch error",
        description: "Could not load escalation masters.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      mobile: record.mobile,
      designation: record.designation,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/escalation-masters/deleteinfo/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Delete failed");

      notification.success({
        message: "Deleted",
        description: "Escalation contact deleted.",
      });
      fetchEscalations();
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Delete error",
        description: err.message || "Could not delete contact.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        mobile: values.mobile.trim(),
        designation: values.designation.trim(),
      };

      const isEdit = !!editingRecord;
      const url = isEdit
        ? `${API_BASE_URL}/escalation-masters/updateinfo/${editingRecord.id}`
        : `${API_BASE_URL}/escalation-masters/addinfo`;
      const method = isEdit ? "PUT" : "POST";

      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Save failed");

      notification.success({
        message: isEdit ? "Updated" : "Created",
        description: isEdit
          ? "Escalation contact updated successfully."
          : "Escalation contact created successfully.",
      });

      setModalOpen(false);
      setEditingRecord(null);
      form.resetFields();
      fetchEscalations();
    } catch (err) {
      if (err?.errorFields) {
        // validation error: do nothing, antd already shows
        return;
      }
      console.error(err);
      notification.error({
        message: "Save error",
        description: err.message || "Could not save contact.",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="escalation-table-name">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Delete contact?"
            description="Are you sure you want to delete this escalation contact?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="escalation-master-container">
      {/* Header row with title + Add button */}
      <div className="escalation-master-header">
        <div>
          <h3 className="escalation-master-title">Escalation Masters</h3>
          <p className="escalation-master-subtitle">
            Maintain escalation contacts used for alerts and notifications.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          className="escalation-master-add-btn"
        >
          Add
        </Button>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        className="escalation-master-table"
        pagination={{ pageSize: 10 }}
      />

      {/* Add / Edit Modal */}
      <Modal
        title={editingRecord ? "Edit Escalation Contact" : "Add Escalation Contact"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        onOk={handleSave}
        okText="Save"
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          name="escalationMasterForm"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter name" },
              { max: 100, message: "Name is too long" },
            ]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input placeholder="name@example.com" />
          </Form.Item>

          <Form.Item
            label="Mobile"
            name="mobile"
            rules={[
              { required: true, message: "Please enter mobile number" },
              {
                pattern: /^\d{10}$/,
                message: "Mobile number must be exactly 10 digits",
              },
            ]}
          >
            <Input placeholder="e.g. 9876543210" maxLength={10} />
          </Form.Item>

          <Form.Item
            label="Designation"
            name="designation"
            rules={[{ required: true, message: "Please enter designation" }]}
          >
            <Input placeholder="e.g. Warden, Dean, Security Head" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EscalationMaster;
