import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/api.js";
import { useLanguage } from "../context/useLanguage.js";
import "./ChatbotWidget.css";

function ChatbotWidget() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I can help with questions about using the voting app." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const launcherRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    inputRef.current?.focus();

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", text: trimmedMessage },
    ]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await apiRequest("/ai/message", {
        method: "POST",
        body: { message: trimmedMessage },
        requiresAuth: true,
      });

      if (typeof response?.reply !== "string" || !response.reply.trim()) {
        throw new Error(t("The AI service returned an empty response."));
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "assistant", text: response.reply.trim() },
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? t(error.message)
              : t("Could not get an AI response."),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <aside className="chatbot-widget">
      {isOpen && (
        <section
          aria-label={t("AI election assistant")}
          aria-modal="false"
          className="chatbot-panel"
          id="chatbot-panel"
          role="dialog"
        >
          <header className="chatbot-header">
            <div className="chatbot-avatar" aria-hidden="true">
              AI
            </div>
            <div className="chatbot-heading">
              <h2>{t("Election assistant")}</h2>
              <p>
                <span className="chatbot-status-dot" /> {t("AI assistant")}
              </p>
            </div>
            <button
              aria-label={t("Close chat")}
              className="chatbot-close"
              onClick={() => {
                setIsOpen(false);
                launcherRef.current?.focus();
              }}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div aria-live="polite" className="chatbot-messages" role="log">
            <div className="chatbot-date-label">{t("TODAY")}</div>
            {messages.map((chatMessage, index) => (
              <div
                className={`chatbot-message chatbot-message-${chatMessage.role}`}
                key={`${chatMessage.role}-${index}`}
              >
                {chatMessage.role === "assistant" && (
                  <span aria-hidden="true" className="chatbot-message-avatar">
                    AI
                  </span>
                )}
                <p>
                  {index === 0 && chatMessage.role === "assistant"
                    ? t(chatMessage.text)
                    : chatMessage.text}
                </p>
              </div>
            ))}
            {isLoading && (
              <div
                className="chatbot-message chatbot-message-assistant"
                role="status"
              >
                <span aria-hidden="true" className="chatbot-message-avatar">
                  AI
                </span>
                <p>{t("Thinking...")}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-composer" onSubmit={handleSubmit}>
            <label className="chatbot-sr-only" htmlFor="chatbot-message">
              {t("Your message")}
            </label>
            <input
              autoComplete="off"
              disabled={isLoading}
              id="chatbot-message"
              maxLength={1000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("Ask a question...")}
              ref={inputRef}
              value={message}
            />
            <button
              aria-label={t("Send message")}
              disabled={!message.trim() || isLoading}
              type="submit"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />
              </svg>
            </button>
          </form>
          <p className="chatbot-disclaimer">
            {t("AI responses may not always be accurate.")}
          </p>
        </section>
      )}

      <button
        aria-controls="chatbot-panel"
        aria-expanded={isOpen}
        aria-label={
          t(isOpen ? "Close election assistant" : "Open election assistant")
        }
        className={`chatbot-launcher ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        ref={launcherRef}
        type="button"
      >
        {isOpen ? (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
          </svg>
        )}
        {!isOpen && <span className="chatbot-launcher-label">{t("Ask AI")}</span>}
      </button>
    </aside>
  );
}

export default ChatbotWidget;
