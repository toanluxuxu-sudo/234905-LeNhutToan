import { useEffect, useRef, useState } from "react";
import "./App.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const statuses = ["Đang sử dụng", "Hư hỏng", "Đang sửa chữa", "Ngừng sử dụng"];
const fields = {
  deviceId: "Mã thiết bị", name: "Tên thiết bị", deviceType: "Loại thiết bị",
  room: "Phòng học", brand: "Hãng sản xuất", model: "Model", quantity: "Số lượng",
  status: "Tình trạng", purchaseDate: "Ngày mua", description: "Ghi chú",
};
const blank = () => ({ deviceId: "", name: "", deviceType: "", room: "", brand: "", model: "", quantity: 1, status: statuses[0], purchaseDate: "", description: "" });

async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${API}${path}`, options); }
  catch { throw new Error("Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy và thử lại."); }
  const data = await response.json();
  if (!response.ok) throw new Error([data.message, ...(data.errors || [])].filter(Boolean).join(". ") || "Thao tác thất bại.");
  return data;
}

export default function App() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(blank);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const latestLoad = useRef(0);
  const formRef = useRef(null);

  async function load(keyword = "") {
    const sequence = ++latestLoad.current;
    setLoading(true);
    try {
      const data = await request(`/api/devices?search=${encodeURIComponent(keyword)}`);
      if (sequence === latestLoad.current) { setDevices(data); setActiveSearch(keyword); }
    } catch (err) { if (sequence === latestLoad.current) setError(err.message); }
    finally { if (sequence === latestLoad.current) setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formOpen, editingId]);

  function openForm(device = null) {
    const values = blank();
    if (device) {
      Object.keys(values).forEach((key) => { values[key] = device[key] ?? values[key]; });
      values.purchaseDate = device.purchaseDate?.slice(0, 10) || "";
    }
    setForm(values); setEditingId(device?._id || null); setDetail(null);
    setFormOpen(true); setError(""); setMessage("");
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await request(editingId ? `/api/devices/${editingId}` : "/api/devices", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      });
      setMessage(editingId ? "Đã cập nhật thiết bị thành công." : "Đã thêm thiết bị thành công.");
      setFormOpen(false); setEditingId(null); setForm(blank());
      await load(activeSearch);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function showDetail(id) {
    setBusy(true); setError(""); setMessage("");
    try { setDetail(await request(`/api/devices/${id}`)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function remove(device) {
    if (!window.confirm(`Xóa thiết bị “${device.name}” (${device.deviceId})?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await request(`/api/devices/${device._id}`, { method: "DELETE" });
      if (detail?._id === device._id) setDetail(null);
      if (editingId === device._id) { setFormOpen(false); setEditingId(null); }
      setMessage("Đã xóa thiết bị thành công.");
      await load(activeSearch);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const disabled = busy || loading;
  return (
    <main className="container">
      <header className="page-header">
        <div><p className="eyebrow">QUẢN LÝ PHÒNG HỌC</p><h1>Thiết bị phòng học</h1><p className="subtitle">Quản lý thông tin, số lượng và tình trạng thiết bị tại một nơi.</p></div>
        <button disabled={busy} onClick={() => openForm()}>+ Thêm thiết bị</button>
      </header>
      {error && <div className="notice error" role="alert">{error}</div>}
      {message && <div className="notice success" role="status">{message}</div>}

      {formOpen && <section className="card" ref={formRef} aria-labelledby="form-title">
        <div className="section-heading"><div><p className="eyebrow">THÔNG TIN THIẾT BỊ</p><h2 id="form-title">{editingId ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}</h2></div><button type="button" className="secondary" disabled={busy} onClick={() => setFormOpen(false)}>Đóng</button></div>
        <form onSubmit={save}><fieldset disabled={busy}>
          <div className="form-grid">{Object.entries(fields).map(([key, label]) => <label key={key}>
            {label}{key !== "description" && " *"}
            {key === "status" ? <select name={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
              : key === "description" ? <textarea name={key} value={form[key]} rows={2} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              : <input name={key} type={key === "quantity" ? "number" : key === "purchaseDate" ? "date" : "text"} value={form[key]} required min={key === "quantity" ? 0 : undefined} step={key === "quantity" ? 1 : undefined} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}
          </label>)}</div>
          <div className="actions"><button type="submit">{busy ? "Đang lưu..." : editingId ? "Lưu cập nhật" : "Lưu thiết bị"}</button><button type="button" className="secondary" onClick={() => setFormOpen(false)}>Hủy</button></div>
        </fieldset></form>
      </section>}

      {detail && <section className="card" aria-labelledby="detail-title">
        <div className="section-heading"><h2 id="detail-title">Chi tiết: {detail.name}</h2><button className="secondary" onClick={() => setDetail(null)}>Đóng chi tiết</button></div>
        <dl className="details">{Object.entries(fields).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{key === "purchaseDate" ? detail[key]?.slice(0, 10) || "—" : String(detail[key] ?? "—") || "—"}</dd></div>)}</dl>
      </section>}

      <section className="card" aria-labelledby="list-title">
        <div className="section-heading"><h2 id="list-title">Danh sách thiết bị</h2><span className="count">{devices.length} bản ghi{activeSearch ? " phù hợp" : ""}</span></div>
        <form className="search-form" onSubmit={(e) => { e.preventDefault(); setError(""); setMessage(""); load(search.trim()); }}>
          <input aria-label="Từ khóa tìm kiếm" value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} placeholder="Nhập mã, tên, loại thiết bị hoặc phòng học..." />
          <button disabled={disabled}>Tìm kiếm</button><button type="button" className="secondary" disabled={disabled} onClick={() => { setSearch(""); setError(""); load(""); }}>Tất cả</button>
        </form>
        {loading ? <p className="empty" role="status">Đang tải danh sách thiết bị...</p> : <div className="table-wrapper"><table>
          <thead><tr><th>Mã thiết bị</th><th>Tên / loại thiết bị</th><th>Phòng</th><th>Số lượng</th><th>Tình trạng</th><th>Thao tác</th></tr></thead>
          <tbody>{devices.map((device) => <tr key={device._id}>
            <td className="device-code">{device.deviceId}</td><td><strong>{device.name}</strong><span className="device-type">{device.deviceType}</span></td><td>{device.room}</td><td>{device.quantity}</td>
            <td><span className={`status status-${statuses.indexOf(device.status)}`}>{device.status}</span></td>
            <td><div className="actions row-actions"><button className="secondary" disabled={busy} onClick={() => showDetail(device._id)}>Chi tiết</button><button className="secondary" disabled={busy} onClick={() => openForm(device)}>Sửa</button><button className="danger" disabled={busy} onClick={() => remove(device)}>Xóa</button></div></td>
          </tr>)}{devices.length === 0 && <tr><td colSpan={6} className="empty">{activeSearch ? "Không tìm thấy thiết bị phù hợp." : "Chưa có thiết bị. Nhấn “Thêm thiết bị” để bắt đầu."}</td></tr>}</tbody>
        </table></div>}
        {busy && <p role="status" className="subtitle">Đang xử lý thao tác...</p>}
      </section>
      <footer>Dữ liệu thiết bị được lưu trên MongoDB Atlas.</footer>
    </main>
  );
}
