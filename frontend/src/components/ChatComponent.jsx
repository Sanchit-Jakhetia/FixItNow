/* eslint-disable no-unused-vars */
// src/components/ChatComponent.jsx
import React, { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { FiSend, FiUser, FiWifi, FiWifiOff } from "react-icons/fi";
import { sendMessageAPI, getMessagesWithUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import axiosInstance from "../utils/axiosInstance";

const ChatComponent = ({
  receiverId,
  receiverName: propReceiverName,
  width = "650px",
  height,
  theme = "provider",
}) => {
  const { token, user } = useAuth();
  const [receiverName, setReceiverName] = useState(propReceiverName || "");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  const themeColors = {
    admin: { primary: "#2563eb", gradient: "linear-gradient(135deg, #2563eb, #60a5fa)" },
    provider: { primary: "#2563eb", gradient: "linear-gradient(135deg, #2563eb, #0ea5e9)" },
    customer: { primary: "#2563eb", gradient: "linear-gradient(135deg, #2563eb, #0ea5e9)" },
  };
  const { primary, gradient } = themeColors[theme] || themeColors.provider;

  // debug - show auth + props
  useEffect(() => {
    console.log("🔎 ChatComponent init", { tokenPresent: !!token, user, receiverId });
  }, [token, user, receiverId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      console.log("💬 Chat updated — last message:", last?.content, "from", last?.senderId);
    }
  }, [messages]);

  // Fetch receiver name
  useEffect(() => {
    if (!receiverId || propReceiverName || !token) return;
    const fetchReceiverName = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8081/api/users/id/${receiverId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReceiverName(res.data?.name || "Unknown User");
      } catch (err) {
        console.error("❌ fetchReceiverName error:", err);
        setReceiverName("Unknown User");
      }
    };
    fetchReceiverName();
  }, [receiverId, token, propReceiverName]);

  // Load previous messages with current user
  useEffect(() => {
    if (!token || !receiverId || !user?.id) return;
    console.log("🔁 Fetching messages with user", receiverId);

    // Mark notifications from this sender as read
    axiosInstance
      .put(`/api/notifications/read-from/${receiverId}`)
      .then(() => console.log("✅ Marked notifications from sender as read"))
      .catch((err) => console.error("❌ Failed to mark notifications as read:", err));

    getMessagesWithUser(receiverId)
      .then((res) => {
        setMessages(res.data || []);
      })
      .catch((err) => console.error("❌ Error loading chat:", err));
  }, [receiverId, token, user?.id]);

  // ✅ WebSocket setup
  useEffect(() => {
    if (!token || !user?.email) {
      console.log("⏳ Waiting for auth before opening WS (token/email missing)");
      return;
    }

    console.log("🌐 Opening WS connection for chat", receiverId);
    const socket = new SockJS("http://localhost:8081/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => console.log("[STOMP]", str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Connected to STOMP");
        setConnected(true);

        const personalQueue = "/user/queue/messages";
        console.log("📡 Subscribing to", personalQueue);

        client.subscribe(
          personalQueue,
          (message) => {
            try {
              const msg = JSON.parse(message.body);
              console.log("📩 Incoming message (raw):", msg);

              const currentChatId = String(receiverId);
              const msgSenderId = String(msg.senderId ?? "");
              const msgReceiverId = String(msg.receiverId ?? "");

              if (msgSenderId === currentChatId || msgReceiverId === currentChatId) {
                console.log(`📨 Message belongs to current chat (${currentChatId}), updating state`);
                setMessages((prev) => {
                  let replaced = false;
                  const next = prev.map((m) => {
                    if (
                      (m.temp && m.content === msg.content) ||
                      (m.id && msg.id && String(m.id) === String(msg.id))
                    ) {
                      replaced = true;
                      return { ...msg };
                    }
                    return m;
                  });
                  if (!replaced) next.push(msg);
                  return next;
                });
              } else {
                console.log("📬 Incoming for other chat — ignoring in this view:", msg);
              }
            } catch (err) {
              console.error("❌ Error parsing WS message:", err);
            }
          },
          { Authorization: `Bearer ${token}` }
        );
      },
      onStompError: (frame) => console.error("❌ STOMP error:", frame),
      onDisconnect: () => {
        console.warn("⚠ STOMP disconnected");
        setConnected(false);
      },
      onWebSocketError: (err) => console.error("❌ WebSocket error:", err),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      console.log("🧹 Cleaning up WebSocket for chat", receiverId);
      client.deactivate();
      setConnected(false);
    };
  }, [token, user?.email, receiverId]);

  const handleTyping = (e) => {
    setInput(e.target.value);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {}, 1500);
  };

  // ✅ Send message
  const sendMessage = async () => {
    if (!input.trim() || !user?.id) return;

    const msgContent = input.trim();
    setInput("");

    const optimistic = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      receiverId,
      content: msgContent,
      senderName: user.name || "You",
      sentAt: new Date().toISOString(),
      temp: true,
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const client = stompClientRef.current;
      if (client?.connected) {
        console.log(`📤 Sending message to user ${receiverId}:`, msgContent);
        client.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify({ receiverId, content: msgContent }),
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        console.log("🌐 WebSocket not connected, sending via REST API...");
        await sendMessageAPI({ receiverId, content: msgContent });
      }
    } catch (err) {
      console.error("❌ Send failed:", err);
    }
  };

  // Render message row
  const renderMessageRow = (msg, i) => {
    const isSender = String(msg.senderId) === String(user?.id);
    return (
      <div
        key={msg.id || i}
        className={`flex mb-2 items-end ${isSender ? "justify-end" : "justify-start"}`}
      >
        {!isSender && (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
            <FiUser className="text-gray-600" />
          </div>
        )}
        <div
          className={`px-3 py-2 rounded-2xl max-w-[100%] text-sm leading-snug break-words shadow ${
            isSender ? "text-white" : "bg-gray-100 text-gray-900"
          }`}
          style={{
            background: isSender ? gradient : undefined,
            borderRadius: isSender ? "18px 18px 0 18px" : "18px 18px 18px 0",
          }}
        >
          {msg.content}
          <div className="text-[10px] mt-1 opacity-70 text-right">
            {new Date(msg.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  };

  const chatHeight = height || (theme === "admin" ? "520px" : theme === "provider" ? "640px" : "640px");
    // ✅ Auto-open Admin chat when "openAdminChat" event is fired globally
useEffect(() => {
  const handleOpenAdminChat = () => {
    if (user?.role === "PROVIDER" || user?.role === "CUSTOMER") {
      // You can set receiverId here for admin if you have a fixed adminId
      console.log("📨 Received openAdminChat event — focusing admin chat window");
      // Optionally scroll or focus input, etc.
    }
  };

  window.addEventListener("openAdminChat", handleOpenAdminChat);
  return () => window.removeEventListener("openAdminChat", handleOpenAdminChat);
}, [user]);


  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
      style={{
        width,
        height: chatHeight,
        maxWidth: "95vw",
        maxHeight: height ? "100%" : "85vh",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(2,132,199,0.06),_transparent_32%)]" />

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 px-4 py-3 text-white shadow-sm" style={{ background: gradient }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/20 backdrop-blur">
            <FiUser size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{receiverName || "Loading conversation..."}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-300" : "bg-amber-300"}`} />
              {connected ? "Online now" : "Reconnecting..."}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 scroll-smooth bg-[linear-gradient(180deg,_rgba(248,250,252,0.94),_rgba(255,255,255,0.98))]">
        {!user?.id || messages.length === 0 ? (
          <div className="mx-auto mt-6 max-w-sm rounded-[1.25rem] border border-dashed border-slate-200 bg-white/80 px-5 py-6 text-center text-sm text-slate-500 shadow-sm backdrop-blur">
            <p className="font-medium text-slate-700">{user?.id ? "No messages yet" : "Loading chat..."}</p>
            <p className="mt-1 text-xs text-slate-500">{user?.id ? "Start the conversation from the box below." : "Please wait while your chat loads."}</p>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {messages.map((m, i) => renderMessageRow(m, i))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-[#2563eb]/20">
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={`Message ${receiverName || "customer"}...`}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!connected}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: connected ? gradient : "linear-gradient(135deg, #94a3b8, #cbd5e1)" }}
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;

