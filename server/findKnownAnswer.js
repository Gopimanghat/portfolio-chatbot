import pool from "./db.js";
import { getEmbedding } from "./embeddings.js";

export async function findKnownAnswer(userMessage) {
    const embedding = await getEmbedding(userMessage);
    const vectorString = `[${embedding.join(",")}]`;

    const result = await pool.query(
        `SELECT question, answer, 1 - (embedding <=> $1) AS similarity
     FROM known_answers
     ORDER BY embedding <=> $1
     LIMIT 1`,
        [vectorString]
    );

    if (result.rows.length === 0) {
        return { match: null, similarity: 0 };
    }

    const { question, answer, similarity } = result.rows[0];
    return { match: { question, answer }, similarity: parseFloat(similarity) };
}