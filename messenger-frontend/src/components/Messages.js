import React from 'react';

export function Messages({ messages }) {
  return (
    <>
      {messages.length > 0 ? (
        messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <strong>{msg.user}</strong>
            <p>{msg.message}</p>
            <span className="timestamp">{msg.timestamp}</span>
          </div>
          ))
        ) : (
        <p>Loading messages...</p>
      )}
    </>
  );
}
