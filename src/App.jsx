import { useState, useRef, useEffect } from "react";

const HR_EMAIL = "RRHH@danaide.com.ar";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = (policies) => `Eres DARI, el asistente virtual de Recursos Humanos de Danaide. Sos amable, profesional y conciso.

Podés ayudar con estas categorías:
1. Políticas internas: estándares de conducta, código de ética, política de redes sociales, home office, dress code.
2. Pago y Compensación: fechas de pago, recibos de sueldo, bonos, deducciones, aumentos.
3. Vacaciones y Licencias: días disponibles, cómo solicitar tiempo libre, licencias por enfermedad, licencias especiales, maternidad/paternidad.

${policies ? `La empresa tiene las siguientes políticas específicas cargadas:\n\n${policies}\n\nPrioriza esta información por sobre el conocimiento general cuando respondas.` : "Como no se han cargado políticas específicas, respondé con buenas prácticas generales de RRHH."}

Reglas importantes:
- Respondé siempre en español, de manera clara y empática.
- Si la consulta es muy específica de la empresa y no tenés la información, incluí exactamente el texto DERIVAR_RRHH al final de tu respuesta.
- No inventes datos numéricos específicos si no están en las políticas cargadas.
- Nunca digas que podés hacer trámites, solo podés informar.`;

const MENU_ITEMS = [
  { category: "Políticas Internas", icon: "📋", color: "#1E3A8A", bg: "#EEF2FF", questions: ["¿Cuál es la política de home office?", "¿Cuáles son los estándares de conducta?", "¿Cuál es la política de redes sociales?", "¿Cómo es el código de vestimenta?"] },
  { category: "Pago y Compensación", icon: "💰", color: "#065F46", bg: "#ECFDF5", questions: ["¿Cuándo se pagan los sueldos?", "¿Cómo accedo a mi recibo de sueldo?", "¿Cómo funcionan los bonos?", "¿Cuáles son las deducciones del sueldo?"] },
  { category: "Vacaciones y Licencias", icon: "🌴", color: "#92400E", bg: "#FFFBEB", questions: ["¿Cuántos días de vacaciones tengo?", "¿Cómo solicito tiempo libre?", "¿Cómo funciona la licencia por enfermedad?", "¿Cuáles son las licencias especiales?"] },
];

export default function App() {
  const [view, setView] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState("");
  const [showPoliciesPanel, setShowPoliciesPanel] = useState(false);
  const [policiesDraft, setPoliciesDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const startChat = (question) => {
    setMessages([]);
    setView("chat");
    setTimeout(() => doSend(question, []), 50);
  };

  const doSend = async (text, currentMessages) => {
    const newMessages = [...currentMessages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const sysPrompt = SYSTEM_PROMPT(policies);
      const contents = newMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sysPrompt }] },
            contents,
          }),
        }
      );
      const data = await response.json();
      let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude procesar tu consulta.";
      const derivar = reply.includes("DERIVAR_RRHH");
      reply = reply.replace("DERIVAR_RRHH", "").trim();
      setMessages((prev) => [...prev, { role: "assistant", content: reply, derivar }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Hubo un error. Por favor intentá de nuevo.", derivar: false }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    doSend(text, messages);
  };

  const fmt = (text) => text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "#F0F4FF" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#1E3A8A,#2563EB)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {view !== "home" && (
            <button onClick={() => { setView(view === "chat" && activeCategory ? "category" : "home"); setMessages([]); }}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", color: "white", width: "32px", height: "32px", cursor: "pointer", fontSize: "18px" }}>←</button>
          )}
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>👥</div>
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>DARI · Asistente de RRHH</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>Danaide · En línea</div>
          </div>
        </div>
        <button onClick={() => { setShowPoliciesPanel(!showPoliciesPanel); setPoliciesDraft(policies); }}
          style={{ background: policies ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.15)", border: policies ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "white", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}>
          {policies ? "✅ Políticas" : "⚙️ Políticas"}
        </button>
      </div>

      {/* POLICIES PANEL */}
      {showPoliciesPanel && (
        <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "16px 18px" }}>
          <div style={{ fontWeight: "600", color: "#1E3A8A", marginBottom: "4px", fontSize: "14px" }}>📋 Políticas de Danaide</div>
          <textarea value={policiesDraft} onChange={(e) => setPoliciesDraft(e.target.value)}
            placeholder={"Ej:\n- Vacaciones: 15 días hábiles anuales\n- Pago: último día hábil del mes"}
            style={{ width: "100%", height: "110px", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "10px", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "8px" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => { setPolicies(policiesDraft); setShowPoliciesPanel(false); setMessages([]); setView("home"); }}
              style={{ background: "#1E3A8A", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>Guardar</button>
            <button onClick={() => setShowPoliciesPanel(false)}
              style={{ background: "transparent", color: "#64748B", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" }}>Cancelar</button>
            {policies && <button onClick={() => { setPolicies(""); setPoliciesDraft(""); setShowPoliciesPanel(false); }}
              style={{ background: "transparent", color: "#EF4444", border: "1px solid #FECACA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", marginLeft: "auto" }}>Borrar</button>}
          </div>
        </div>
      )}

      {/* HOME */}
      {view === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>👋</div>
            <div style={{ fontWeight: "700", fontSize: "18px", color: "#1E293B" }}>¡Hola! Soy DARI</div>
            <div style={{ color: "#64748B", fontSize: "13px", marginTop: "4px" }}>Tu asistente de Recursos Humanos de Danaide.<br />¿En qué puedo ayudarte hoy?</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {MENU_ITEMS.map((item) => (
              <div key={item.category} style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <button onClick={() => { setActiveCategory(item); setView("category"); }}
                  style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: item.color, fontSize: "14px" }}>{item.category}</div>
                    <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}>{item.questions.length} preguntas frecuentes</div>
                  </div>
                  <span style={{ color: "#CBD5E1", fontSize: "20px" }}>›</span>
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "16px", padding: "14px", background: "white", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>O escribí tu consulta</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) startChat(input.trim()); }}
                placeholder="Ej: ¿Cuándo cobro este mes?"
                style={{ flex: 1, border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", outline: "none", color: "#1E293B" }} />
              <button onClick={() => { if (input.trim()) startChat(input.trim()); }} disabled={!input.trim()}
                style={{ background: input.trim() ? "#1E3A8A" : "#E2E8F0", border: "none", borderRadius: "10px", color: "white", padding: "10px 16px", cursor: input.trim() ? "pointer" : "not-allowed", fontSize: "16px" }}>➤</button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY */}
      {view === "category" && activeCategory && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: activeCategory.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>{activeCategory.icon}</div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px", color: activeCategory.color }}>{activeCategory.category}</div>
              <div style={{ color: "#94A3B8", fontSize: "12px" }}>Seleccioná una pregunta</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeCategory.questions.map((q) => (
              <button key={q} onClick={() => startChat(q)}
                style={{ background: "white", border: `1px solid ${activeCategory.bg}`, borderRadius: "12px", padding: "14px 16px", textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#1E293B", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {q}<span style={{ color: "#CBD5E1", fontSize: "20px", marginLeft: "8px" }}>›</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: "16px", padding: "14px", background: "#FFF7ED", borderRadius: "12px", border: "1px solid #FED7AA" }}>
            <div style={{ fontSize: "13px", color: "#92400E", fontWeight: "600", marginBottom: "4px" }}>¿No encontrás lo que buscás?</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button onClick={() => { setActiveCategory(null); setView("chat"); }}
                style={{ background: "#1E3A8A", color: "white", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>💬 Escribir consulta</button>
              <a href={`mailto:${HR_EMAIL}`}
                style={{ background: "white", color: "#92400E", border: "1px solid #FED7AA", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>✉️ Contactar RRHH</a>
            </div>
          </div>
        </div>
      )}

      {/* CHAT */}
      {view === "chat" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && !loading && <div style={{ textAlign: "center", color: "#94A3B8", fontSize: "13px", marginTop: "20px" }}>Escribí tu consulta 👇</div>}
            {messages.map((msg, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-end" }}>
                  {msg.role === "assistant" && <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>👥</div>}
                  <div style={{ maxWidth: "75%", background: msg.role === "user" ? "linear-gradient(135deg,#1E3A8A,#2563EB)" : "white", color: msg.role === "user" ? "white" : "#1E293B", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: "13px", lineHeight: "1.6", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                    dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
                </div>
                {msg.derivar && (
                  <div style={{ marginTop: "10px", marginLeft: "38px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "12px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#92400E", marginBottom: "4px" }}>📩 Contactar a RRHH</div>
                    <div style={{ fontSize: "12px", color: "#B45309", marginBottom: "10px" }}>Para esta consulta necesitás hablar directamente con el equipo de Recursos Humanos de Danaide.</div>
                    <a href={`mailto:${HR_EMAIL}`} style={{ display: "inline-block", background: "#1E3A8A", color: "white", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: "600", textDecoration: "none" }}>✉️ {HR_EMAIL}</a>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>👥</div>
                <div style={{ background: "white", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", gap: "4px" }}>
                  {[0,1,2].map((j) => <div key={j} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563EB", animation: "bounce 1.2s infinite", animationDelay: `${j*0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ background: "white", borderTop: "1px solid #E2E8F0", padding: "12px 18px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Escribí tu consulta..." rows={1}
                style={{ flex: 1, border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", outline: "none", resize: "none", fontFamily: "inherit", lineHeight: "1.5", maxHeight: "80px", overflowY: "auto", color: "#1E293B" }}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px"; }} />
              <button onClick={sendMessage} disabled={!input.trim() || loading}
                style={{ width: "40px", height: "40px", borderRadius: "10px", background: input.trim() && !loading ? "#1E3A8A" : "#E2E8F0", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                {loading ? "⏳" : "➤"}
              </button>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
