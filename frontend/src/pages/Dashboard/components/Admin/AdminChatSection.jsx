import React, { useState } from 'react';

import ChatComponent from '../../../../components/ChatComponent';

export default function AdminChatSection({ users }) {
  const [selectedUser, setSelectedUser] = useState(null);

  // Show only providers and customers (not admins)
  const chatUsers = users.filter(
    (u) => (u.role || "").toLowerCase() !== "admin"
  );

  return (
    <div className="flex min-h-[78vh] flex-col overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:flex-row">
      <div className="w-full border-b border-slate-200 bg-[linear-gradient(180deg,_#f8fbff,_#eef4ff)] p-4 lg:w-[340px] lg:border-b-0 lg:border-r">
        <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Conversation Inbox</h3>
              <p className="text-sm text-slate-500">Choose a user to open admin conversation.</p>
            </div>
            <div className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
              {chatUsers.length}
            </div>
          </div>
        </div>

        <div className="mt-4 h-[60vh] space-y-2 overflow-y-auto pr-1">
          {chatUsers.length === 0 ? (
            <p className="mt-8 text-center text-sm text-slate-500">No users available</p>
          ) : (
            chatUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUser(u)}
                className={`w-full rounded-[1.4rem] p-4 text-left transition-all duration-200 ${
                  selectedUser?.id === u.id
                    ? "bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/25"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${selectedUser?.id === u.id ? "bg-white/15 text-white" : "bg-blue-50 text-[#1d4ed8]"}`}>
                      {(u.name || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{u.name}</div>
                      <div className={`text-xs ${selectedUser?.id === u.id ? "text-white/75" : "text-slate-500"}`}>{u.role}</div>
                    </div>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${selectedUser?.id === u.id ? "bg-emerald-300" : "bg-slate-300"}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-stretch justify-center bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.06),_transparent_35%),linear-gradient(180deg,_#fbfdff,_#f3f7ff)] p-4">
        {selectedUser ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <ChatComponent receiverId={selectedUser.id} receiverName={selectedUser.name} width="100%" height="100%" theme="admin" />
          </div>
        ) : (
          <div className="w-full max-w-xl rounded-[1.8rem] border border-dashed border-slate-300 bg-white/80 px-8 py-14 text-center text-slate-500 shadow-sm backdrop-blur">
            <h4 className="text-lg font-semibold text-slate-900">Select a user</h4>
            <p className="mt-2 text-sm text-slate-500">Your admin conversation will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
