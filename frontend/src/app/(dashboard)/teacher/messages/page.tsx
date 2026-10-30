"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import {
  getMessageContacts,
  getMessageThread,
  sendMessage,
  type Contact,
  type Message,
} from "@/lib/api";
import { ButtonComponent } from "@/components/ui/button";
import { InputComponent } from "@/components/ui/input";
import { Loader2, AlertCircle, Send, Clock, User } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

export default function TeacherMessagesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    loadContacts();
    // Poll every 10s for new messages
    const interval = setInterval(() => {
      if (selectedContact) {
        loadThread(selectedContact.id);
      }
    }, 10000);
    setPollInterval(interval);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const loadContacts = async () => {
    try {
      const res = await getMessageContacts();
      setContacts(res.data || []);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const loadThread = useCallback(async (contactId: string) => {
    try {
      const res = await getMessageThread(contactId);
      setThread(res.data || []);
    } catch {
      setError(t("common.error"));
    }
  }, []);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setThread([]);
    loadThread(contact.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !content.trim()) return;
    setSending(true);
    try {
      await sendMessage({ receiverId: selectedContact.id, content: content.trim() });
      setContent("");
      loadThread(selectedContact.id);
    } catch {
      setError(t("common.error"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col lg:flex-row lg:h-[600px] border rounded-xl overflow-hidden bg-card shadow-sm">
        {/* Contacts sidebar */}
        <aside className="lg:w-80 border-r flex-col">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Messages</h3>
            <p className="text-xs text-muted-foreground">Parents of your students</p>
          </div>
          {contacts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No contacts found.
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectContact(c)}
                  className={twMerge(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition",
                    selectedContact?.id === c.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <User size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.role}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Chat thread */}
        <main className="flex-1 flex flex-col bg-background">
          {!selectedContact ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <User size={48} className="mb-3 opacity-50" />
              <p className="text-sm">Select a parent to start chatting</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
                <div className="flex items-center gap-2">
                  <User size={20} />
                  <h3 className="font-semibold">{selectedContact.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground">{selectedContact.role}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  thread.map((msg) => {
                    const isSender = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={twMerge(
                          "flex max-w-[80%]",
                          isSender ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={twMerge(
                            "rounded-lg p-3 text-sm break-words shadow-sm",
                            isSender
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-muted text-foreground rounded-tl-none"
                          )}
                        >
                          {msg.content}
                        </div>
                        <div className={`text-[10px] mt-1 ${isSender ? "text-right" : "text-left"}`}>
                          {isSender ? "text-primary/60" : "text-muted-foreground/60"}
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="p-3 border-t bg-card">
                <div className="flex gap-2">
                  <InputComponent
                    placeholder="Type a message…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={sending}
                  />
                  <ButtonComponent
                    variant="default"
                    type="submit"
                    disabled={sending || !content.trim()}
                    className="min-w-[auto] px-4"
                  >
                    <Send size={18} />
                  </ButtonComponent>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
