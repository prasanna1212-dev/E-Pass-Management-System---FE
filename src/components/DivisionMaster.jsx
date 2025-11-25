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
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import "../styles/DivisionMaster.css";

const DivisionMaster = () => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/division-master-route/getinfo`);
      if (!res.ok) throw new Error("Failed to fetch divisions");
      const data = await res.json();
      setDivisions(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load divisions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
    });
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalSubmitting(true);

      const isEdit = !!editingRecord;
      const url = isEdit
        ? `${API_BASE_URL}/division-master-route/updateinfo/${editingRecord.id}`
        : `${API_BASE_URL}/division-master-route/addinfo`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errRes = await res.json().catch(() => ({}));
        throw new Error(errRes.message || "Something went wrong");
      }

      message.success(isEdit ? "Division updated" : "Division created");
      handleModalCancel();
      fetchDivisions();
    } catch (err) {
      // antd form validation error
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Unable to save division");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/division-master-route/deleteinfo/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errRes = await res.json().catch(() => ({}));
        throw new Error(errRes.message || "Delete failed");
      }

      message.success("Division deleted");
      fetchDivisions();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Unable to delete division");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
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
            title="Delete division?"
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
          Manage configuration for escalation and other master data.
        </p>
      </div>

      <div className="masters-card">
        <div className="masters-card-header">
          <div>
            <h3>Division Masters</h3>
            <p className="masters-card-description">
              Maintain division records used across the application.
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            className="masters-add-btn"
          >
            Add
          </Button>
        </div>

        <Table
          rowKey="id"
          dataSource={divisions}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        open={modalVisible}
        title={editingRecord ? "Edit Division" : "Add Division"}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        confirmLoading={modalSubmitting}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter division name" },
              { max: 255, message: "Name is too long" },
            ]}
          >
            <Input placeholder="e.g. KITE, CAS" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DivisionMaster;
