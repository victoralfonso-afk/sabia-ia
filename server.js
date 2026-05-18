import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY não configurada. Crie um arquivo .env com sua chave.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    app: "Sabiá IA Pro",
    message: "API funcionando"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], mode = "chat" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Envie o campo message." });
    }

    const systemByMode = {
      chat: "Você é o Sabiá IA Pro, um assistente completo, profissional, direto e útil em português do Brasil.",
      codigo: "Você é um programador especialista. Gere códigos completos, organizados, comentados e prontos para uso.",
      imagem: "Você é um criador de prompts para imagens. Gere prompts ricos, profissionais e realistas.",
      negocios: "Você é um consultor de negócios para marmoraria, marcenaria, vendas, finanças e gestão.",
      arquivos: "Você é um analista de documentos. Resuma, extraia pontos importantes e organize informações."
    };

    const safeHistory = Array.isArray(history)
      ? history.slice(-12).filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      : [];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemByMode[mode] || systemByMode.chat },
        ...safeHistory,
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    res.json({
      reply: completion.choices?.[0]?.message?.content || "Não consegui gerar resposta."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erro ao gerar resposta",
      details: error.message
    });
  }
});

app.post("/api/prompt-imagem", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: "Envie description." });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "Crie prompts profissionais para geração de imagens realistas em português." },
        { role: "user", content: `Crie um prompt profissional para esta imagem: ${description}` }
      ]
    });

    res.json({ prompt: completion.choices?.[0]?.message?.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Sabiá IA API rodando em http://localhost:${PORT}`);
});
