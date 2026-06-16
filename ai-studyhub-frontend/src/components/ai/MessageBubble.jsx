export default function MessageBubble({ text, sender = 'ai' }) {
  return <div className={`message-bubble ${sender}`}>{text}</div>
}
