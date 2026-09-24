"use client";

import { useState, useRef, useEffect } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    { sender: "bot", content: "Hi! Ask me anything about my work or background." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [conversationId, setConversationId] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactDismissedForSession, setContactDismissedForSession] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactError, setContactError] = useState(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const bottomRef = useRef(null);

useEffect(() => {
  if (!conversationId) return;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/conversations/${conversationId}`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();

      setMessages((prevMessages) => {
        if (data.messages.length > prevMessages.length) {
          return data.messages.map((m) => ({
            sender: m.sender,
            content: m.content,
          }));
        }
        return prevMessages;
      });
    } catch (err) {
      // Silently ignore polling errors
    }
  }, 9000);

  return () => clearInterval(interval);
}, [conversationId]);



  useEffect(() => {
  const loadHistory = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/conversations/by-session", {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data.conversation && data.messages.length > 0) {
        const restored = data.messages.map((m) => ({
          sender: m.sender,
          content: m.content,
        }));
        setMessages(restored);
        setConversationId(data.conversation.id);

        if (!data.conversation.visitor_email) {
          setContactDismissedForSession(false);
        } else {
          setContactSubmitted(true);
        }
      }
    } catch (err) {
      // Silently ignore — fall back to default greeting
    }
  };

  loadHistory();
}, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showContactForm]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // If the contact form is open and they keep chatting instead, dismiss it
    if (showContactForm) {
      setShowContactForm(false);
      setContactDismissedForSession(true);
    }

    setMessages((prev) => [...prev, { sender: "user", content: trimmed }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", content: data.reply }]);

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.askForContact && !contactDismissedForSession && !contactSubmitted) {
        setShowContactForm(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContactSubmit = async () => {
    setContactError(null);

    if (!contactEmail.trim() || !EMAIL_REGEX.test(contactEmail.trim())) {
      setContactError("Please enter a valid email address.");
      return;
    }

    if (!conversationId) {
      setContactError("Something went wrong. Please try again.");
      return;
    }

    setContactSubmitting(true);

    try {
      const res = await fetch(
        `http://localhost:4000/api/conversations/${conversationId}/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            visitor_name: contactName.trim() || null,
            visitor_email: contactEmail.trim(),
          }),
        }
      );

      if (!res.ok) throw new Error("Request failed");

      setShowContactForm(false);
      setContactSubmitted(true);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", content: "Thanks, I'll be in touch!" },
      ]);
    } catch (err) {
      setContactError("Something went wrong, try again.");
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleContactDismiss = () => {
    setShowContactForm(false);
    setContactDismissedForSession(true);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[600px] border border-gray-800 rounded-xl bg-gray-950 overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
{messages.map((msg, idx) => (
  <div
    key={idx}
    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
        msg.sender === "user"
          ? "bg-blue-600 text-white rounded-br-sm"
          : msg.sender === "admin"
          ? "bg-green-700 text-white rounded-bl-sm"
          : "bg-gray-800 text-gray-100 rounded-bl-sm"
      }`}
    >
      {msg.content}
    </div>
  </div>
))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-4 py-2 rounded-2xl text-sm bg-gray-800 text-gray-400 rounded-bl-sm">
              ...
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="text-xs text-red-400 bg-red-950 px-3 py-1 rounded-full">
              {error}
            </div>
          </div>
        )}

        {/* Inline contact capture form */}
        {showContactForm && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 space-y-2">
              <p className="text-sm">
                Want to leave your email so I can follow up personally?
              </p>

              <input
                type="text"
                placeholder="Name (optional)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={contactSubmitting}
                className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />

              <input
                type="email"
                placeholder="Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={contactSubmitting}
                className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />

              {contactError && (
                <p className="text-xs text-red-400">{contactError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleContactSubmit}
                  disabled={contactSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  {contactSubmitting ? "Submitting..." : "Submit"}
                </button>
                <button
                  onClick={handleContactDismiss}
                  disabled={contactSubmitting}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  No thanks
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input box */}
      <div className="flex items-center gap-2 border-t border-gray-800 p-3 bg-gray-900">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1 bg-gray-800 text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}