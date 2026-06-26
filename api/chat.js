export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const body = req.body;
  const userMessage = body?.message?.text || "";

  if (!userMessage) {
    return res.json({ text: "Hola! Soy DARI, el asistente de RRHH de Danaide. ¿En qué puedo ayudarte?" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Eres DARI, el asistente virtual de Recursos Humanos de Danaide. Sos amable, profesional y conciso. Respondé siempre en español. Ayudás con políticas internas, pago y compensación, vacaciones y licencias. Si no podés responder, indicá que contacten a RRHH@danaide.com.ar`,
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No pude procesar tu consulta. Contactá a RRHH@danaide.com.ar";

    return res.json({ text: reply });
  } catch (err) {
    return res.json({ text: "Hubo un error. Por favor contactá a RRHH@danaide.com.ar" });
  }
}
