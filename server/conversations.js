import pool from "./db.js";
import { v4 as uuidv4 } from "uuid";

// Find existing conversation by session ID, or create a new one
export async function getOrCreateConversation(sessionId) {
    const existing = await pool.query(
        `SELECT * FROM conversations WHERE session_id = $1`,
        [sessionId]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0];
    }

    const adminToken = uuidv4();

    const inserted = await pool.query(
        `INSERT INTO conversations (session_id, admin_token) VALUES ($1, $2) RETURNING *`,
        [sessionId, adminToken]
    );

    return inserted.rows[0];
}

// Save a single message (sender is "user" or "bot")
export async function saveMessage(conversationId, sender, content) {
    await pool.query(
        `INSERT INTO messages (conversation_id, sender, content) VALUES ($1, $2, $3)`,
        [conversationId, sender, content]
    );
}

// Save visitor contact info onto a conversation
export async function saveVisitorContact(conversationId, name, email) {
    const result = await pool.query(
        `UPDATE conversations SET visitor_name = $1, visitor_email = $2 WHERE id = $3 RETURNING *`,
        [name, email, conversationId]
    );

    return result.rows[0];
}

// Get full message history for a conversation
export async function getConversationHistory(conversationId) {
    const conversation = await pool.query(
        `SELECT * FROM conversations WHERE id = $1`,
        [conversationId]
    );

    if (conversation.rows.length === 0) {
        return null;
    }

    const messages = await pool.query(
        `SELECT id, sender, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversationId]
    );

    return {
        conversation: conversation.rows[0],
        messages: messages.rows,
    };
}



export async function getConversationBySessionId(sessionId) {
    const conversation = await pool.query(
        `SELECT * FROM conversations WHERE session_id = $1`,
        [sessionId]
    );

    if (conversation.rows.length === 0) {
        return null;
    }

    const messages = await pool.query(
        `SELECT id, sender, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversation.rows[0].id]
    );

    return {
        conversation: conversation.rows[0],
        messages: messages.rows,
    };
}



export async function getConversationByAdminToken(token) {
    const conversation = await pool.query(
        `SELECT * FROM conversations WHERE admin_token = $1`,
        [token]
    );

    if (conversation.rows.length === 0) {
        return null;
    }

    const messages = await pool.query(
        `SELECT id, sender, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversation.rows[0].id]
    );

    return {
        conversation: conversation.rows[0],
        messages: messages.rows,
    };
}

export async function saveAdminReply(adminToken, content) {
    const conversation = await pool.query(
        `SELECT id FROM conversations WHERE admin_token = $1`,
        [adminToken]
    );

    if (conversation.rows.length === 0) {
        return null;
    }

    const conversationId = conversation.rows[0].id;

    const inserted = await pool.query(
        `INSERT INTO messages (conversation_id, sender, content) VALUES ($1, 'admin', $2) RETURNING *`,
        [conversationId, content]
    );

    return inserted.rows[0];
}