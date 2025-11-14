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

    // set backend explicitly to IPv4 loopback
    this.backend = 'http://127.0.0.1:5000'; // Use IPv4 loopback
    this.typingTimeout = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.showWelcome();
  }

  bindEvents() {
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.teachBtn.addEventListener('click', () => this.openTeachModal());
    this.teachClose.forEach((btn) => btn.addEventListener('click', () => this.closeTeachModal()));
    this.teachSave.addEventListener('click', () => this.saveTeaching());
  }

  showWelcome() {
    this.addMessage(
      'ai',
      'Welcome to Alpha AI! 👋 I\'m here to help you with anything. Select your profile type from the sidebar to get personalized responses.'
    );
  }

  addMessage(role, content) {
    const msgEl = document.createElement('div');
    msgEl.className = `msg ${role}`;

    const contentEl = document.createElement('div');
    contentEl.className = 'msg-content';

    if (role === 'ai') {
      // Add typewriter effect for AI messages
      this.typewriterEffect(contentEl, content);
    } else {
      contentEl.textContent = content;
    }

    msgEl.appendChild(contentEl);
    this.chatEl.appendChild(msgEl);
    this.scrollToBottom();
  }

  typewriterEffect(element, text) {
    let index = 0;
    const speed = 30; // ms per character

    const type = () => {
      if (index < text.length) {
        element.textContent = text.substring(0, index + 1);
        index++;
        this.typingTimeout = setTimeout(type, speed);
      }
    };

    type();
  }

  addTypingIndicator() {
    const msgEl = document.createElement('div');
    msgEl.className = 'msg ai';
    msgEl.id = 'typing-indicator';

    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;

    msgEl.appendChild(typingEl);
    this.chatEl.appendChild(msgEl);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) {
      typingEl.remove();
    }
  }

  async sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.addMessage('user', text);
    this.inputEl.value = '';
    this.sendBtn.disabled = true;

    this.addTypingIndicator();

    try {
      const payload = {
        message: text,
        profile: this.profileEl.value
      };

      const res = await fetch(`${this.backend}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      this.removeTypingIndicator();

      if (data.error) {
        this.addMessage('ai', `Error: ${data.error}`);
      } else {
        try {
          const content = data.choices?.[0]?.message?.content || JSON.stringify(data);
          this.addMessage('ai', content);
        } catch (err) {
          this.addMessage('ai', JSON.stringify(data));
        }
      }
    } catch (err) {
      this.removeTypingIndicator();
      this.addMessage('ai', `Network error: ${err.message}`);
    } finally {
      this.sendBtn.disabled = false;
      this.inputEl.focus();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatEl.scrollTop = this.chatEl.scrollHeight;
    }, 0);
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
    this.toastEl.className = `toast ${type === 'error' ? 'error' : ''}`;

    setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AlphaChat();
});
