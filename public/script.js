// Minimal client that talks to backend /api/chat (no API key in client)
class AlphaChat {
  constructor() {
    this.chatEl = document.getElementById('chat');
    this.inputEl = document.getElementById('message');
    this.sendBtn = document.getElementById('send');
    this.profileEl = document.getElementById('profile');

    this.teachBtn = document.getElementById('teachBtn');
    this.teachModal = document.getElementById('teachModal');
    this.teachSave = document.getElementById('teachSave');
    this.teachClose = document.querySelectorAll('#teachClose, #teachClose2');
    this.toastEl = document.getElementById('toast');

    // CRITICAL FIX: Use a relative path ('') to match the Flask server's port (8000)
    this.backend = ''; 
    this.typingTimeout = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.showWelcome();
    this.inputEl.focus();
  }

  bindEvents() {
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
      this.autoAdjustTextarea();
    });
    this.inputEl.addEventListener('input', () => this.autoAdjustTextarea());

    this.teachBtn.addEventListener('click', () => this.openTeachModal());
    this.teachClose.forEach((btn) =>
      btn.addEventListener('click', () => this.closeTeachModal())
    );
    this.teachSave.addEventListener('click', () => this.saveTeaching());

    this.profileEl.addEventListener('change', () => this.scrollToBottom());
  }
  
  autoAdjustTextarea() {
    this.inputEl.style.height = 'auto';
    this.inputEl.style.height = this.inputEl.scrollHeight + 'px';
  }

  showWelcome() {
    const welcomeMessage = "Hello! I'm Alpha AI. How can I assist you today? Try switching your profile for a different experience.";
    this.addMessage('ai', welcomeMessage);
  }

  async sendMessage() {
    const message = this.inputEl.value.trim();
    if (!message) return;

    this.addMessage('user', message);
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto'; // Reset height after sending

    // Disable input and send button while waiting for response
    this.sendBtn.disabled = true;
    this.inputEl.disabled = true;

    // Add placeholder message for typing animation
    const aiMessageEl = this.addMessage('ai', '...');
    const contentEl = aiMessageEl.querySelector('.message-content');
    contentEl.textContent = ''; // Clear content for typing

    this.scrollToBottom();

    const profile = this.profileEl.value;

    try {
      const response = await fetch(`${this.backend}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, profile }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Use dynamic typing for the AI response
        this.typeText(contentEl, data.answer);
      } else {
        this.showToast(data.error || 'An unknown API error occurred.', 'error');
        contentEl.textContent = data.error || 'Error: Could not get a response.';
      }
    } catch (error) {
      this.showToast('Network error or server connection failed.', 'error');
      contentEl.textContent = 'Error: Network connection failed.';
      console.error('Fetch error:', error);
      // Re-enable controls if fetch fails before typing starts
      this.sendBtn.disabled = false;
      this.inputEl.disabled = false;
    }
  }

  // Pure JavaScript function to mimic the TextType animation
  typeText(element, text) {
    let i = 0;
    const speed = 30; // Typing speed in milliseconds

    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        this.scrollToBottom();
        this.typingTimeout = setTimeout(type, speed);
      } else {
        // Typing finished, re-enable controls
        this.sendBtn.disabled = false;
        this.inputEl.disabled = false;
        this.inputEl.focus();
      }
    };

    type();
  }

  addMessage(sender, content) {
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${sender}-avatar`;
    avatar.textContent = sender === 'user' ? 'U' : 'A';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Set content here, if it's not being typed
    if (sender === 'user') {
      contentDiv.textContent = content;
    }

    if (sender === 'user') {
      messageRow.appendChild(contentDiv);
      messageRow.appendChild(avatar);
    } else {
      messageRow.appendChild(avatar);
      messageRow.appendChild(contentDiv);
    }

    this.chatEl.appendChild(messageRow);
    this.scrollToBottom();

    return messageRow; // Return the message row for dynamic updates
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatEl.scrollTop = this.chatEl.scrollHeight;
    }, 50);
  }

  openTeachModal() {
    this.teachModal.classList.remove('hidden');
  }

  closeTeachModal() {
    this.teachModal.classList.add('hidden');
    document.getElementById('teach_q').value = '';
    document.getElementById('teach_a').value = '';
  }

  saveTeaching() {
    const q = document.getElementById('teach_q').value.trim().toLowerCase();
    const a = document.getElementById('teach_a').value.trim();
    const t = document.getElementById('teach_type').value;

    if (!q || !a) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    // Store locally in localStorage (for demo purposes)
    const store = JSON.parse(localStorage.getItem('alpha_teach') || '{}');
    store[q] = store[q] || {};
    store[q][t] = a;
    localStorage.setItem('alpha_teach', JSON.stringify(store));

    this.showToast('Response saved successfully!');
    this.closeTeachModal();
  }

  showToast(message, type = 'success') {
    this.toastEl.textContent = message;
    this.toastEl.className = `toast ${type}`;
    this.toastEl.classList.remove('hidden');
    
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AlphaChat();
});
