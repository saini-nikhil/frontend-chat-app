import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import "./Style/chat.css";

function MessageArea({ 
  username, 
  room, 
  messages, 
  typingUsers, 
  selectedUser,
  roomCreator,
  requestingAccess,
  sendMessageToServer,
  handleTyping,
  setShowInviteUsers,
  deleteRoom,
  socketRef
}) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageObserver = useRef(null);
  const messageRefs = useRef({});
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Set up intersection observer for marking messages as seen
  useEffect(() => {
    if (!socketRef || !username) return;
    
    // Initialize the observer
    messageObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            if (messageId && messages) {
              const message = messages.find(m => m.id === messageId);
              if (message && message.sender !== username && message.status !== 'seen') {
                // Call socket to mark message as seen
                socketRef.current.emit('messageSeen', {
                  messageId,
                  room,
                  username
                });
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    
    // Observe all message elements
    Object.values(messageRefs.current).forEach(ref => {
      if (ref) {
        messageObserver.current.observe(ref);
      }
    });
    
    return () => {
      if (messageObserver.current) {
        messageObserver.current.disconnect();
      }
    };
  }, [messages, room, username]);
  
  // Function to set ref for a message
  const setMessageRef = (el, messageId) => {
    if (el && messageId) {
      messageRefs.current[messageId] = el;
      if (messageObserver.current) {
        messageObserver.current.observe(el);
      }
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const sendMessage = (e) => {
    e.preventDefault();
    
    if (message.trim() === '') return;
    
    // Send message to server
    sendMessageToServer(message);
    
    // Clear input
    setMessage('');
    
    // Stop typing indicator
    handleTypingChange(false);
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 100);
  };
  
  const handleTypingChange = (isTyping) => {
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing event
    handleTyping(isTyping);
    
    // If typing, set a timeout to stop typing indicator after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    }
  };
  
  // Helper function to render message status icon
  const renderMessageStatus = (message) => {
    if (message.sender !== username) return null;

    switch (message.status) {
      case 'sent':
        return (
          <span className="message-status sent" title="Sent">
            <span className="tick">✓</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="message-status delivered" title="Delivered">
            <span className="tick double">✓</span>
          </span>
        );
      case 'seen':
        return (
          <span className="message-status seen" title="Seen">
            <span className="tick double">✓</span>
          </span>
        );
      default:
        return (
          <span className="message-status" title="Sending...">
            <span className="tick">...</span>
          </span>
        );
    }
  };
  
  // Get the display name for the current room
  const getRoomDisplayName = () => {
    if (selectedUser) {
      return `Chat with ${selectedUser}`;
    }
    return `#${room}`;
  };

  return (
    <div className="chat-main">
      <div className="chat-header">
        <h2>{getRoomDisplayName()}</h2>
        <div className="header-actions">
          {requestingAccess && (
            <div className="access-requesting">
              Requesting access...
            </div>
          )}
          {!room.startsWith('dm_') && (
            <>
              <button 
                className="invite-btn"
                onClick={() => setShowInviteUsers(true)}
                title="Invite users to this room"
              >
                Invite Users
              </button>
              {roomCreator === username && room !== 'general' && (
                <button 
                  className="delete-room-btn"
                  onClick={deleteRoom}
                  title="Delete this room"
                >
                  Delete Room
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === username ? 'own-message' : ''}`}
            data-message-id={msg.id}
            ref={(el) => setMessageRef(el, msg.id)}
          >
            <div className="message-info">
              <span className="sender">{msg.sender}</span>
              <span className="time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {msg.text}
              {renderMessageStatus(msg)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </div>
        )}
      </div>
      
      <form className="message-form" onSubmit={sendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTypingChange(e.target.value.trim() !== '');
          }}
        />
        <button className="send-button" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

export default MessageArea; 