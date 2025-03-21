import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

export default function typecomponent() {
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [newTags, setNewTags] = useState("");
  const [editing, setEditing] = useState({ docId: null, field: "", value: "" });

  useEffect(() => {
    const colRef = collection(db, "type");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      setTypes(
        snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }))
      );
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!selectedType || !newTags.trim()) return;
    try {
      await addDoc(collection(db, "type"), { phanloai: selectedType, mota: newTags });
      setSelectedType("");
      setNewTags("");
    } catch (error) {
      console.error("Lỗi thêm document:", error);
    }
  };

  const handleDelete = async (docId) => {
    try {
      await deleteDoc(doc(db, "type", docId));
    } catch (error) {
      console.error("Lỗi xóa document:", error);
    }
  };

  const handleDoubleClick = (docId, field, value) => {
    setEditing({ docId, field, value });
  };

  const handleChange = (e) => {
    setEditing((prev) => ({ ...prev, value: e.target.value }));
  };

  const saveChanges = async () => {
    const { docId, field, value } = editing;
    if (!docId || !field) return;
    try {
      await updateDoc(doc(db, "type", docId), { [field]: value });
    } catch (error) {
      console.error("Lỗi cập nhật document:", error);
    } finally {
      setEditing({ docId: null, field: "", value: "" });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveChanges();
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Quản lý Tags</h2>

      {/* Form nhập dữ liệu */}
      <div className="row mb-4">
        <div className="col-md-5">
          <input
            type="text"
            className="form-control"
            placeholder="Phân loại"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />
        </div>
        <div className="col-md-5">
          <input
            type="text"
            className="form-control"
            placeholder="Mô tả"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={handleAdd}>
            Thêm
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Phân loại</th>
            <th>Mô tả</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {types.map((item) => (
            <tr key={item.docId}>
              {["phanloai", "mota"].map((field) => (
                <td
                  key={field}
                  onDoubleClick={() => handleDoubleClick(item.docId, field, item[field])}
                  style={{ cursor: "pointer" }}
                >
                  {editing.docId === item.docId && editing.field === field ? (
                    <input
                      type="text"
                      className="form-control"
                      autoFocus
                      value={editing.value}
                      onChange={handleChange}
                      onBlur={saveChanges}
                      onKeyDown={handleKeyDown}
                    />
                  ) : (
                    item[field]
                  )}
                </td>
              ))}
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.docId)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
