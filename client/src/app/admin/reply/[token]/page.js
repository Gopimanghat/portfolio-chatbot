"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function AdminReplyPage() {
    const { token } = useParams();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(null);

    const bottomRef = useRef(null);

    useEffect(() => {
        const loadConversation = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/conversation/${token}`);

                if (!res.ok) {
                    setError("Conversation not found.");
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                setMessages(data.messages);
                setLoading(false);
            } catch (err) {
                setError("Something went wrong loading this conversation.");
                setLoading(false);
            }
        };

        loadConversation();
    }, [token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const trimmed = replyText.trim();
        if (!trimmed || sending) return;

        setSending(true);
        setSendError(null);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/conversation/${token}/reply`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: trimmed }),
                }
            );

            if (!res.ok) throw new Error("Request failed");

            const data = await res.json();
            setMessages((prev) => [...prev, data.message]);
            setReplyText("");
        } catch (err) {
            setSendError("Failed to send reply. Try again.");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
                Loading conversation...
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-950 text-red-400">
                {error}
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
            <div className="flex flex-col w-full max-w-2xl h-[600px] border border-gray-800 rounded-xl bg-gray-950 overflow-hidden">
                <div className="border-b border-gray-800 px-4 py-3">
                    <h1 className="text-white text-sm font-semibold">Admin Reply Panel</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === "user"
                                ? "justify-end"
                                : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${msg.sender === "user"
                                    ? "bg-blue-600 text-white rounded-br-sm"
                                    : msg.sender === "admin"
                                        ? "bg-green-700 text-white rounded-bl-sm"
                                        : "bg-gray-800 text-gray-100 rounded-bl-sm"
                                    }`}
                            >
                                <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
                                    {msg.sender}
                                </p>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <div className="border-t border-gray-800 p-3 bg-gray-900 space-y-2">
                    {sendError && <p className="text-xs text-red-400">{sendError}</p>}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your reply..."
                            disabled={sending}
                            className="flex-1 bg-gray-800 text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                        >
                            {sending ? "Sending..." : "Send"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}