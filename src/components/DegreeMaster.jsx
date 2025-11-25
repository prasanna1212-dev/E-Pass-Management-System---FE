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
import "../styles/DegreeMaster.css";

const { Option } = Select;

const DegreeMaster = () => {
  const [degrees, setDegrees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  /** FETCH DIVISIONS */
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

  /** FETCH DEGREES */
  const fetchDegrees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/degree-master-route/getinfo`);
      if (!res.ok) throw new Error("Failed to fetch degrees");

      const data = await res.json();
      setDegrees(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load degrees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
    fetchDegrees();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      divisionId: record.division_id,
      degree: record.degree_name,
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

      const payload = {
        divisionId: values.divisionId,
        degree: values.degree,
      };

      const isEdit = !!editingRecord;

      const url = isEdit
        ? `${API_BASE_URL}/degree-master-route/updateinfo/${editingRecord.id}`
        : `${API_BASE_URL}/degree-master-route/addinfo`;

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

      message.success(isEdit ? "Degree updated" : "Degree created");
      handleModalCancel();
      fetchDegrees();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Unable to save degree");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/degree-master-route/deleteinfo/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errRes = await res.json().catch(() => ({}));
        throw new Error(errRes.message || "Delete failed");
      }

      message.success("Degree deleted");
      fetchDegrees();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Unable to delete degree");
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
            title="Delete degree?"
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
          Manage configuration for degree and other master data.
        </p>
      </div>

      <div className="masters-card">
        <div className="masters-card-header">
          <div>
            <h3>Degree Masters</h3>
            <p className="masters-card-description">
              Maintain degree records mapped with divisions.
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
          dataSource={degrees}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        open={modalVisible}
        title={editingRecord ? "Edit Degree" : "Add Degree"}
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
            <Select placeholder="Select division">
              {divisions.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Degree"
            name="degree"
            rules={[
              { required: true, message: "Please enter degree" },
              { max: 255, message: "Degree is too long" },
            ]}
          >
            <Input placeholder="e.g. B.E, MBA, B.Com…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DegreeMaster;
