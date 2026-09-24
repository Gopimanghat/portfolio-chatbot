import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";

import { findKnownAnswer } from "./findKnownAnswer.js";
import { getLLMFallbackReply } from "./llmFallback.js";
import { sendAlertEmail } from "./sendAlertEmail.js";
import {
    getOrCreateConversation,
    saveMessage,
    saveVisitorContact,
    getConversationHistory,
    getConversationBySessionId,
    getConversationByAdminToken,
    saveAdminReply,
} from "./conversations.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
    "http://localhost:3000",
    "https://portfolio-chatbot-pink.vercel.app",
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Ensure every visitor has a session ID cookie
// Ensure every visitor has a session ID cookie
app.use((req, res, next) => {
    let sessionId = req.cookies.session_id;

    if (!sessionId) {
        sessionId = uuidv4();
        res.cookie("session_id", sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        });
    }

    req.sessionId = sessionId;
    next();
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.post("/api/message", async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const conversation = await getOrCreateConversation(req.sessionId);

        await saveMessage(conversation.id, "user", message);

        const { match, similarity } = await findKnownAnswer(message);
        console.log("Similarity:", similarity, "Match:", match?.question);

        if (match && similarity > 0.7) {
            await saveMessage(conversation.id, "bot", match.answer);
            return res.json({
                reply: match.answer,
                source: "known",
                similarity,
                conversationId: conversation.id,
            });
        }

        // Unknown question — LLM fallback + email alert
        const llmReply = await getLLMFallbackReply(message);
        await saveMessage(conversation.id, "bot", llmReply);

        await sendAlertEmail(
            message,
            conversation.visitor_name,
            conversation.visitor_email,
            conversation.admin_token
        );

        const askForContact = !conversation.visitor_email;

        res.json({
            reply: llmReply,
            source: "llm_fallback",
            similarity,
            conversationId: conversation.id,
            askForContact,
        });
    } catch (err) {
        console.error("Error in /api/message:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/api/conversations/:id/contact", async (req, res) => {
    const { id } = req.params;
    const { visitor_name, visitor_email } = req.body;

    if (!visitor_email) {
        return res.status(400).json({ error: "visitor_email is required" });
    }

    try {
        const updated = await saveVisitorContact(id, visitor_name || null, visitor_email);
        res.json({ conversation: updated });
    } catch (err) {
        console.error("Error saving contact:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/api/conversations/by-session", async (req, res) => {
    try {
        const history = await getConversationBySessionId(req.sessionId);

        if (!history) {
            return res.json({ conversation: null, messages: [] });
        }

        res.json(history);
    } catch (err) {
        console.error("Error fetching conversation by session:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/api/conversations/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const history = await getConversationHistory(id);

        if (!history) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.json(history);
    } catch (err) {
        console.error("Error fetching conversation:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// --- Admin routes ---

app.get("/api/admin/conversation/:token", async (req, res) => {
    const { token } = req.params;

    try {
        const history = await getConversationByAdminToken(token);

        if (!history) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.json(history);
    } catch (err) {
        console.error("Error fetching admin conversation:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/api/admin/conversation/:token/reply", async (req, res) => {
    const { token } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "content is required" });
    }

    try {
        const saved = await saveAdminReply(token, content);

        if (!saved) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.json({ message: saved });
    } catch (err) {
        console.error("Error saving admin reply:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});