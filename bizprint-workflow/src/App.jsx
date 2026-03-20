import { useState, useEffect, useRef } from "react";

const STAGES = [
  { id: "new", label: "Шинэ захиалга", icon: "📥", color: "#3b82f6", next: "design" },
  { id: "design", label: "Дизайн", icon: "🎨", color: "#8b5cf6", next: "ready" },
  { id: "ready", label: "Бэлэн", icon: "✅", color: "#f59e0b", next: "printing" },
  { id: "printing", label: "Хэвлэж байна", icon: "🖨️", color: "#ef4444", next: "done" },
  { id: "done", label: "Дууссан", icon: "📦", color: "#10b981", next: null },
];

const STAFF = ["Бат", "Сараа", "Болд", "Оюунаа", "Тэмүүжин"];

const INITIAL_ORDERS = [
  { id: "ORD-001", client: "Монгол Банк", item: "Нэрийн хуудас x500", price: 180000, stage: "new", assignee: null, priority: "high", created: "2026-03-17 09:30", logs: [{ time: "03/17 09:30", user: "Систем", action: "Захиалга үүсгэсэн" }] },
  { id: "ORD-002", client: "Номин", item: "Брошур A4 x200", price: 320000, stage: "new", assignee: null, priority: "normal", created: "2026-03-18 11:00", logs: [{ time: "03/18 11:00", user: "Систем", action: "Захиалга үүсгэсэн" }] },
  { id: "ORD-003", client: "Говь ХК", item: "Баннер 3x2м", price: 450000, stage: "design", assignee: "Сараа", priority: "high", created: "2026-03-15 14:20", logs: [{ time: "03/15 14:20", user: "Систем", action: "Захиалга үүсгэсэн" }, { time: "03/15 16:00", user: "Болд", action: "Дизайн руу шилжүүлсэн" }, { time: "03/15 16:05", user: "Болд", action: "Сараа-д хуваарилсан" }] },
  { id: "ORD-004", client: "Sky Resort", item: "Флаер A5 x1000", price: 250000, stage: "design", assignee: "Болд", priority: "normal", created: "2026-03-16 10:00", logs: [{ time: "03/16 10:00", user: "Систем", action: "Захиалга үүсгэсэн" }, { time: "03/16 12:30", user: "Оюунаа", action: "Дизайн руу шилжүүлсэн" }] },
  { id: "ORD-005", client: "Хаан Банк", item: "Постер B1 x50", price: 520000, stage: "ready", assignee: "Бат", priority: "urgent", created: "2026-03-14 08:00", logs: [{ time: "03/14 08:00", user: "Систем", action: "Захиалга үүсгэсэн" }, { time: "03/14 10:00", user: "Бат", action: "Дизайн руу шилжүүлсэн" }, { time: "03/15 17:00", user: "Сараа", action: "Дизайн баталсан" }, { time: "03/16 09:00", user: "Бат", action: "Хэвлэлд бэлэн" }] },
  { id: "ORD-006", client: "Ard Insurance", item: "Нэрийн хуудас x300", price: 120000, stage: "printing", assignee: "Тэмүүжин", priority: "normal", created: "2026-03-13 13:45", logs: [{ time: "03/13 13:45", user: "Систем", action: "Захиалга үүсгэсэн" }, { time: "03/13 15:00", user: "Болд", action: "Дизайн эхлүүлсэн" }, { time: "03/14 11:00", user: "Болд", action: "Дизайн дууссан" }, { time: "03/15 09:00", user: "Тэмүүжин", action: "Хэвлэж эхэлсэн" }] },
  { id: "ORD-007", client: "MCS Group", item: "Каталог 20 хуудас x100", price: 890000, stage: "printing", assignee: "Бат", priority: "high", created: "2026-03-10 09:00", logs: [{ time: "03/10 09:00", user: "Систем", action: "Захиалга үүсгэсэн" }, { time: "03/10 14:00", user: "Сараа", action: "Дизайн эхэлсэн" }, { time: "03/13 16:00", user: "Сараа", action: "Дизайн баталсан" }, { time: "03/14 08:30", user: "Бат", action: "Хэвлэж эхэлсэн" }] },
  { id: "ORD-008", client: "УБ Таксі", item: "Стикер x2000", price: 160000, stage: "done", assignee: "Оюунаа", priority: "normal", created: "2026-03-08 10:00", logs: [{ time: "03/08 10:00", user: "Систем", action: "Захиалга үүсгэсэн" }, { time: "03/08 14:00", user: "Оюунаа", action: "Дизайн" }, { time: "03/09 11:00", user: "Оюунаа", action: "Хэвлэлд бэлэн" }, { time: "03/10 16:00", user: "Бат", action: "Хэвлэсэн" }, { time: "03/11 12:00", user: "Оюунаа", action: "Хүлээлгэж өгсөн" }] },
];

const NOW = () => {
  const d = new Date();
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const priorityBadge = (p) => {
  if (p === "urgent") return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", text: "🔴 Яаралтай" };
  if (p === "high") return { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", text: "🟠 Өндөр" };
  return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", text: "🟢 Энгийн" };
};

const formatPrice = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "₮";

export default function WorkflowKanban() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selected, setSelected] = useState(null);
  const [currentUser, setCurrentUser] = useState("Бат");
  const [noteText, setNoteText] = useState("");
  const [showToast, setShowToast] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  const moveToNext = (order) => {
    const stage = STAGES.find(s => s.id === order.stage);
    if (!stage?.next) return;
    const nextStage = STAGES.find(s => s.id === stage.next);
    setOrders(prev => prev.map(o => {
      if (o.id !== order.id) return o;
      return {
        ...o,
        stage: stage.next,
        logs: [...o.logs, { time: NOW(), user: currentUser, action: `"${nextStage.label}" руу шилжүүлсэн` }]
      };
    }));
    setShowToast(`${order.id} → ${nextStage.icon} ${nextStage.label}`);
    if (selected?.id === order.id) {
      setSelected(prev => ({
        ...prev,
        stage: stage.next,
        logs: [...prev.logs, { time: NOW(), user: currentUser, action: `"${nextStage.label}" руу шилжүүлсэн` }]
      }));
    }
  };

  const assignUser = (orderId, user) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        assignee: user,
        logs: [...o.logs, { time: NOW(), user: currentUser, action: `${user}-д хуваарилсан` }]
      };
    }));
  };

  const addNote = (orderId) => {
    if (!noteText.trim()) return;
    const log = { time: NOW(), user: currentUser, action: noteText.trim() };
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, logs: [...o.logs, log] };
    }));
    setSelected(prev => prev ? { ...prev, logs: [...prev.logs, log] } : prev);
    setNoteText("");
  };

  const getStageOrders = (stageId) => orders.filter(o => o.stage === stageId);

  const totalRevenue = orders.filter(o => o.stage === "done").reduce((s, o) => s + o.price, 0);
  const activeCount = orders.filter(o => o.stage !== "done").length;

  return (
    <div style={{ fontFamily: "'Geist', 'SF Pro Display', -apple-system, sans-serif", background: "#0c0f1a", color: "#e2e8f0", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .card-item { transition: all 0.2s ease; cursor: pointer; }
        .card-item:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
        .move-btn { transition: all 0.15s ease; }
        .move-btn:hover { transform: scale(1.02); filter: brightness(1.2); }
        .move-btn:active { transform: scale(0.98); }
        .stage-col { animation: slideIn 0.4s ease backwards; }
        .log-row { animation: fadeIn 0.3s ease; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#3b82f6" }}>Biz</span>Print
            <span style={{ color: "#64748b", fontWeight: 400, fontSize: 14, marginLeft: 8 }}>Workflow Pipeline</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginLeft: 24 }}>
            <div style={{ background: "#1e293b", borderRadius: 8, padding: "6px 14px", fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>Идэвхтэй</span>
              <span style={{ color: "#f59e0b", fontWeight: 700, marginLeft: 6, fontFamily: "'JetBrains Mono', monospace" }}>{activeCount}</span>
            </div>
            <div style={{ background: "#1e293b", borderRadius: 8, padding: "6px 14px", fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>Орлого</span>
              <span style={{ color: "#10b981", fontWeight: 700, marginLeft: 6, fontFamily: "'JetBrains Mono', monospace" }}>{formatPrice(totalRevenue)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Нэвтэрсэн:</span>
          <select
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 6, padding: "5px 10px", fontSize: 13, cursor: "pointer", outline: "none" }}
          >
            {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div style={{ display: "flex", flex: 1, gap: 1, overflow: "hidden", background: "#0f1525" }}>
        {STAGES.map((stage, si) => {
          const stageOrders = getStageOrders(stage.id);
          return (
            <div key={stage.id} className="stage-col" style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0c0f1a", animationDelay: `${si * 0.06}s`, minWidth: 0 }}>
              {/* Column Header */}
              <div style={{ padding: "14px 12px 10px", borderBottom: "2px solid " + stage.color + "33", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{stage.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: stage.color }}>{stage.label}</span>
                  </div>
                  <span style={{
                    background: stage.color + "22",
                    color: stage.color,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>{stageOrders.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflow: "auto", padding: "8px 8px 8px" }}>
                {stageOrders.map((order, i) => {
                  const pb = priorityBadge(order.priority);
                  const nextStage = STAGES.find(s => s.id === stage.next);
                  return (
                    <div
                      key={order.id}
                      className="card-item"
                      onClick={() => { setSelected(order); setNoteText(""); }}
                      style={{
                        background: "#131827",
                        border: "1px solid #1e293b",
                        borderRadius: 10,
                        padding: "10px 12px",
                        marginBottom: 6,
                        animation: `slideIn 0.3s ease ${i * 0.05}s backwards`,
                        borderLeft: `3px solid ${stage.color}55`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{order.id}</span>
                        <span style={{ fontSize: 9, background: pb.bg, color: pb.color, padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{pb.text}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 4, lineHeight: 1.3 }}>{order.client}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{order.item}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>{formatPrice(order.price)}</span>
                        {order.assignee && (
                          <span style={{ fontSize: 10, background: "#1e293b", color: "#94a3b8", padding: "2px 7px", borderRadius: 4 }}>👤 {order.assignee}</span>
                        )}
                      </div>

                      {/* One-click move button */}
                      {nextStage && (
                        <button
                          className="move-btn"
                          onClick={(e) => { e.stopPropagation(); moveToNext(order); }}
                          style={{
                            width: "100%",
                            marginTop: 8,
                            padding: "6px 0",
                            background: `linear-gradient(135deg, ${stage.color}22, ${nextStage.color}22)`,
                            border: `1px solid ${nextStage.color}44`,
                            borderRadius: 6,
                            color: nextStage.color,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4
                          }}
                        >
                          {nextStage.icon} {nextStage.label} →
                        </button>
                      )}
                    </div>
                  );
                })}
                {stageOrders.length === 0 && (
                  <div style={{ textAlign: "center", padding: "24px 8px", color: "#334155", fontSize: 12 }}>
                    Захиалга байхгүй
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {showToast && (
        <div style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1e293b",
          border: "1px solid #334155",
          color: "#e2e8f0",
          padding: "10px 24px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          animation: "toastIn 0.3s ease",
          zIndex: 999
        }}>
          ✅ {showToast}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div ref={modalRef} style={{
            background: "#131827",
            border: "1px solid #1e293b",
            borderRadius: 16,
            width: "90%",
            maxWidth: 560,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            animation: "slideIn 0.3s ease"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{selected.id}</span>
                    {(() => { const pb = priorityBadge(selected.priority); return <span style={{ fontSize: 10, background: pb.bg, color: pb.color, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{pb.text}</span>; })()}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>{selected.client}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{selected.item}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "#1e293b", border: "none", color: "#94a3b8", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>

              {/* Info Row */}
              <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <div style={{ background: "#0c0f1a", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>Дүн: </span>
                  <span style={{ color: "#10b981", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{formatPrice(selected.price)}</span>
                </div>
                <div style={{ background: "#0c0f1a", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>Төлөв: </span>
                  <span style={{ color: STAGES.find(s => s.id === selected.stage)?.color, fontWeight: 600 }}>
                    {STAGES.find(s => s.id === selected.stage)?.icon} {STAGES.find(s => s.id === selected.stage)?.label}
                  </span>
                </div>
                <div style={{ background: "#0c0f1a", borderRadius: 8, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#64748b" }}>Хариуцагч:</span>
                  <select
                    value={selected.assignee || ""}
                    onChange={(e) => {
                      const user = e.target.value;
                      assignUser(selected.id, user);
                      setSelected(prev => ({
                        ...prev,
                        assignee: user,
                        logs: [...prev.logs, { time: NOW(), user: currentUser, action: `${user}-д хуваарилсан` }]
                      }));
                    }}
                    style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 4, padding: "2px 6px", fontSize: 12, cursor: "pointer", outline: "none" }}
                  >
                    <option value="">Сонгох...</option>
                    {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Move Button in Modal */}
              {(() => {
                const stage = STAGES.find(s => s.id === selected.stage);
                const nextStage = stage?.next ? STAGES.find(s => s.id === stage.next) : null;
                if (!nextStage) return null;
                return (
                  <button
                    className="move-btn"
                    onClick={() => {
                      moveToNext(selected);
                    }}
                    style={{
                      width: "100%",
                      marginTop: 12,
                      padding: "10px 0",
                      background: `linear-gradient(135deg, ${stage.color}, ${nextStage.color})`,
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    {nextStage.icon} {nextStage.label} руу шилжүүлэх →
                  </button>
                );
              })()}
            </div>

            {/* Audit Trail */}
            <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                📋 Audit Trail ({selected.logs.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[...selected.logs].reverse().map((log, i) => (
                  <div key={i} className="log-row" style={{
                    display: "flex",
                    gap: 10,
                    padding: "7px 10px",
                    background: i === 0 ? "#1e293b" : "transparent",
                    borderRadius: 6,
                    alignItems: "baseline",
                  }}>
                    <span style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", minWidth: 90 }}>{log.time}</span>
                    <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, minWidth: 70 }}>{log.user}</span>
                    <span style={{ fontSize: 12, color: i === 0 ? "#f1f5f9" : "#94a3b8" }}>{log.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Note */}
            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #1e293b", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addNote(selected.id); }}
                  placeholder="Тэмдэглэл бичих..."
                  style={{
                    flex: 1,
                    background: "#0c0f1a",
                    border: "1px solid #334155",
                    color: "#e2e8f0",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => addNote(selected.id)}
                  style={{
                    background: noteText.trim() ? "#3b82f6" : "#1e293b",
                    border: "none",
                    color: noteText.trim() ? "#fff" : "#475569",
                    borderRadius: 8,
                    padding: "0 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: noteText.trim() ? "pointer" : "default",
                    transition: "all 0.15s",
                  }}
                >
                  Нэмэх
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
