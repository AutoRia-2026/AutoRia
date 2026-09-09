import type { FormEvent } from 'react'
import type { Conversation, Message } from '../types/cars'

type MessagesPageProps = {
  userId: number
  conversations: Conversation[]
  activeConversation: Conversation | null
  messageText: string
  isLoading: boolean
  isSending: boolean
  setActiveConversation: (conversation: Conversation) => void
  setMessageText: (value: string) => void
  submitMessage: (event: FormEvent<HTMLFormElement>) => void
  openBuy: () => void
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function messageAuthor(message: Message, userId: number) {
  return message.sender === userId ? 'You' : message.sender_name
}

function MessagesPage({
  userId,
  conversations,
  activeConversation,
  messageText,
  isLoading,
  isSending,
  setActiveConversation,
  setMessageText,
  submitMessage,
  openBuy,
}: MessagesPageProps) {
  return (
    <section className="messages-page">
      <div className="messages-heading">
        <div>
          <h1>Messages</h1>
          <p>Talk with buyers and sellers about listings, price and availability.</p>
        </div>
        <button type="button" onClick={openBuy}>Browse cars</button>
      </div>

      <div className="messages-layout">
        <aside className="conversation-list">
          <div>
            <h2>Conversations</h2>
            <span>{conversations.length}</span>
          </div>
          {isLoading && <p className="soft-note">Loading messages...</p>}
          {!isLoading && conversations.length === 0 && (
            <div className="empty-conversations">
              <strong>No conversations yet</strong>
              <p>Open a vehicle page and contact the seller to start a chat.</p>
            </div>
          )}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={activeConversation?.id === conversation.id ? 'active' : ''}
              onClick={() => setActiveConversation(conversation)}
            >
              <img src={conversation.car_image_url || 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=500&q=80'} alt={conversation.car_title} />
              <span>
                <strong>{conversation.participant_name}</strong>
                <small>{conversation.car_title}</small>
                <em>{conversation.latest_message?.text || 'No messages yet'}</em>
              </span>
              {conversation.unread_count > 0 && <mark>{conversation.unread_count}</mark>}
            </button>
          ))}
        </aside>

        <section className="chat-panel">
          {activeConversation ? (
            <>
              <header>
                <div>
                  <h2>{activeConversation.participant_name}</h2>
                  <p>{activeConversation.car_title}</p>
                </div>
                <span>{activeConversation.messages.length} messages</span>
              </header>

              <div className="chat-messages">
                {activeConversation.messages.length === 0 && (
                  <p className="soft-note">Write the first message about this listing.</p>
                )}
                {activeConversation.messages.map((message) => (
                  <article key={message.id} className={message.sender === userId ? 'own' : ''}>
                    <div>
                      <strong>{messageAuthor(message, userId)}</strong>
                      <time>{formatMessageTime(message.created_at)}</time>
                    </div>
                    <p>{message.text}</p>
                  </article>
                ))}
              </div>

              <form className="chat-composer" onSubmit={submitMessage}>
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type your message"
                />
                <button type="submit" disabled={isSending || !messageText.trim()}>{isSending ? 'Sending...' : 'Send'}</button>
              </form>
            </>
          ) : (
            <div className="empty-chat">
              <h2>Select a conversation</h2>
              <p>Your active chat will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default MessagesPage
