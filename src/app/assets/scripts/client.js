'use strict';

// Setup socket connection
const socket = io('http://localhost:5500');

// DOM Elements
const elements = {
  username: document.getElementById('username'),
  room: document.getElementById('room'),
  joinRoom: document.getElementById('join-room'),
  message: document.getElementById('message'),
  send: document.getElementById('send'),
  chat: document.getElementById('chat'),
  broadcast: document.getElementById('broadcast'),
};

// Variables
let currentRoom = '';
let typingTimeout = null;

// Helper Functions
const clearInput = (inputElement) => {
  inputElement.value = '';
};

const isInputValid = (input) => input.trim() !== '';

const appendMessage = (username, message, type = 'received', time) => {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const messageHTML = `
    <div class="message ${type}">
      <strong>${username}:</strong>
      <span class="message-bg">${message}</span>
      <span class="timestamp">${time || timestamp}</span>
    </div>`;

  if (type === 'typing') {
    elements.broadcast.innerHTML = messageHTML;
  } else {
    elements.broadcast.innerHTML = ''; // Clear typing notifications
    elements.chat.innerHTML += messageHTML;
    elements.chat.scrollTop = elements.chat.scrollHeight; // Auto-scroll to latest message
  }
};

// Join Room Event
elements.joinRoom.addEventListener('click', () => {
  const username = elements.username.value.trim();
  const room = elements.room.value.trim();

  if (isInputValid(username) && isInputValid(room)) {
    socket.emit('joinRoom', { username, room });
    currentRoom = room; // Update current room
    elements.chat.innerHTML = ''; // Clear chat for new room
    clearInput(elements.message);
  } else {
    alert('Please enter both username and room name.');
  }
});

// Send Message Event
elements.send.addEventListener('click', () => {
  const username = elements.username.value.trim();
  const message = elements.message.value.trim();

  if (isInputValid(username) && isInputValid(message) && currentRoom) {
    socket.emit('chatMessage', { room: currentRoom, username, message });
    clearInput(elements.message);
  } else {
    alert('Please enter a message and ensure you are in a room.');
  }
});

// Typing Notification Event
elements.message.addEventListener('input', () => {
  const username = elements.username.value.trim();

  if (isInputValid(username) && currentRoom) {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing', { username, room: currentRoom });
    }, 500);
  }
});

// Receive Messages
socket.on('message', ({ username, message, timestamp }) => {
  const time = new Date(timestamp).toLocaleTimeString();
  appendMessage(
    username,
    `${message}`,
    username.toLocaleLowerCase() === elements.username.value.trim().toLocaleLowerCase()
      ? 'sent'
      : 'received',
    time
  );
});

// Receive Typing Notifications
socket.on('typing', ({ username }) => {
  appendMessage(username, 'is typing...', 'typing');
});

socket.on('stopTyping', () => {
  elements.broadcast.innerHTML = '';
});

// Load Previous Messages
socket.on('loadMessages', (messages) => {
  messages.forEach(({ username, message, timestamp }) => {
    const time = new Date(timestamp).toLocaleTimeString();
    appendMessage(
      username,
      `${message}`,
      username.toLocaleLowerCase() === elements.username.value.trim().toLocaleLowerCase()
        ? 'sent'
        : 'received',
      time
    );
  });
});
