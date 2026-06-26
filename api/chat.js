export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ text: "DARI activo" });
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const body = req.body;
  
  // Log para ver qué manda Google
  console.log("BODY RECIBIDO:", JSON.stringify(body));

  if (body?.type === "ADDED_TO_SPACE") {
    return res.json({ text: "¡Hola! Soy DARI 👋 ¿En qué puedo ayudarte?" });
  }

  const userMessage = body?.message?.text || body?.text || "";
  
  console.log("MENSAJE:", userMessage);

  if (!userMessage) {
    return res.json({ text: "¿En qué puedo ayudarte?" });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Eres DARI, asistente de RRHH de Danaide. Respondé siempre en español de forma concisa." },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await groqRes.json();
    console.log("GROQ RESPONSE:", JSON.stringify(data));
    const reply = data.choices?.[0]?.message?.content || "No pude responder. Contactá a RRHH@danaide.com.ar";

    return res.status(200).json({ text: reply });
  } catch (err) {
    console.log("ERROR:", err.message);
    return res.status(200).json({ text: "Error. Contactá a RRHH@danaide.com.ar" });
  }
}
