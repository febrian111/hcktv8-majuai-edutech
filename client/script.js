// ==========================================================================
// CONFIGURATION & CONSTANTS
// ==========================================================================
const API_URL = 'http://localhost:3000/api/chat';
const STORAGE_KEY = 'gemini_chat_history';

// DOM Elements - Chatbot
const chatContainer = document.getElementById('floating-chat-container');
const chatWidget = document.getElementById('chat-widget');
const chatLauncherBtn = document.getElementById('chat-launcher-btn');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const clearChatBtn = document.getElementById('clear-chat-btn');
const sendBtn = document.getElementById('send-btn');
const quickPrompts = document.getElementById('quick-prompts');
const heroTryAiBtn = document.getElementById('hero-try-ai-btn');
const openAiWidgetBtns = document.querySelectorAll('.open-ai-widget-btn');

// DOM Elements - Carousel
const carouselTrack = document.getElementById('carousel-track');
const carouselSlides = document.querySelectorAll('.carousel-slide');
const carouselPrevBtn = document.getElementById('carousel-prev');
const carouselNextBtn = document.getElementById('carousel-next');
const carouselDots = document.querySelectorAll('.carousel-dots .dot');

// DOM Elements - Testimonial Filters
const testimonialTabs = document.querySelectorAll('.testimonial-tabs .tab-btn');
const testimonialCards = document.querySelectorAll('.testimonial-card');

// DOM Elements - Booking Modal & Contact
const bookingModal = document.getElementById('booking-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalOkBtn = document.getElementById('modal-ok-btn');
const openBookingBtns = document.querySelectorAll('.open-booking-btn');
const contactBookingForm = document.getElementById('contact-booking-form');
const toastNotification = document.getElementById('toast');

// DOM Elements - Mobile Navigation
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.getElementById('nav-links');

// Chat state
let conversation = [];
let isSending = false;

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initChatbot();
  initCarousel();
  initTestimonialsFilter();
  initBookingModal();
  initMobileNav();
});

// ==========================================================================
// CHATBOT ENGINE & LOCAL STORAGE PERSISTENCE
// ==========================================================================
function initChatbot() {
  loadHistory();
  renderChat();

  // Launcher Toggle
  chatLauncherBtn.addEventListener('click', () => {
    toggleChatWidget();
  });

  closeChatBtn.addEventListener('click', () => {
    closeChatWidget();
  });

  // External trigger buttons
  if (heroTryAiBtn) {
    heroTryAiBtn.addEventListener('click', () => {
      openChatWidget();
    });
  }

  openAiWidgetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      openChatWidget();
    });
  });

  // Quick Prompt Chips
  if (quickPrompts) {
    quickPrompts.addEventListener('click', (e) => {
      const chip = e.target.closest('.prompt-chip');
      if (chip && !isSending) {
        const promptText = chip.getAttribute('data-prompt');
        if (promptText) {
          userInput.value = promptText;
          submitUserMessage(promptText);
        }
      }
    });
  }

  // Clear Chat History
  clearChatBtn.addEventListener('click', () => {
    if (conversation.length === 0) return;
    const confirmed = confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan dengan AI Study Tutor?');
    if (confirmed) {
      conversation = [];
      localStorage.removeItem(STORAGE_KEY);
      renderChat();
      showToast('Riwayat chat berhasil dihapus');
    }
  });

  // Chat Form Submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSending) return;
    const text = userInput.value.trim();
    if (!text) return;
    submitUserMessage(text);
  });
}

function openChatWidget() {
  chatContainer.classList.add('active');
  chatWidget.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    userInput.focus();
  }, 200);
}

function closeChatWidget() {
  chatContainer.classList.remove('active');
  chatWidget.setAttribute('aria-hidden', 'true');
}

function toggleChatWidget() {
  const isOpen = chatContainer.classList.toggle('active');
  chatWidget.setAttribute('aria-hidden', (!isOpen).toString());
  if (isOpen) {
    setTimeout(() => {
      userInput.focus();
    }, 200);
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        conversation = parsed;
      }
    }
  } catch (err) {
    console.error('Error loading chat history from localStorage:', err);
    conversation = [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  } catch (err) {
    console.error('Error saving chat history to localStorage:', err);
  }
}

function renderChat() {
  chatBox.innerHTML = '';

  if (conversation.length === 0) {
    showEmptyState();
    return;
  }

  conversation.forEach(item => {
    appendMessageToDOM(item.role === 'model' ? 'bot' : 'user', item.text);
  });

  scrollToBottom();
}

function showEmptyState() {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  emptyDiv.innerHTML = `
    <div class="empty-state-icon">🤖</div>
    <p><strong>Halo! Saya AI Study Tutor.</strong></p>
    <p class="hint">Tanyakan kesulitan PR, rumus matematika, fisika, atau materi ujian sekolahmu!</p>
  `;
  chatBox.appendChild(emptyDiv);
}

function appendMessageToDOM(sender, text, isError = false) {
  const emptyState = chatBox.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${sender}`;

  const msg = document.createElement('div');
  msg.className = `message ${sender}${isError ? ' error' : ''}`;
  msg.textContent = text;

  wrapper.appendChild(msg);
  chatBox.appendChild(wrapper);
  scrollToBottom();

  return wrapper;
}

function showTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper bot';
  wrapper.id = 'typing-indicator';

  const bubble = document.createElement('div');
  bubble.className = 'typing-bubble';
  bubble.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setFormState(disabled) {
  isSending = disabled;
  userInput.disabled = disabled;
  sendBtn.disabled = disabled;
  if (!disabled) {
    userInput.focus();
  }
}

async function submitUserMessage(userMessage) {
  appendMessageToDOM('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });
  saveHistory();

  userInput.value = '';
  setFormState(true);
  showTypingIndicator();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server responded with status ${response.status}`);
    }

    const reply = data.reply || 'Maaf, tutor sedang tidak dapat merespons.';
    conversation.push({ role: 'model', text: reply });
    saveHistory();
    appendMessageToDOM('bot', reply);
  } catch (error) {
    console.error('Chat API error:', error);
    appendMessageToDOM(
      'bot',
      `⚠️ Tidak dapat terhubung ke AI Tutor (${error.message}). Pastikan server berjalan di port 3000.`,
      true
    );
  } finally {
    hideTypingIndicator();
    setFormState(false);
  }
}

// ==========================================================================
// HERO CAROUSEL CONTROLLER
// ==========================================================================
function initCarousel() {
  let currentSlide = 0;
  const totalSlides = carouselSlides.length;
  let autoSlideTimer = null;

  function showSlide(index) {
    if (index >= totalSlides) currentSlide = 0;
    else if (index < 0) currentSlide = totalSlides - 1;
    else currentSlide = index;

    carouselSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });

    carouselDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(nextSlide, 5000);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  if (carouselNextBtn && carouselPrevBtn) {
    carouselNextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoSlide();
    });

    carouselPrevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoSlide();
    });
  }

  carouselDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const slideIndex = parseInt(e.target.getAttribute('data-slide'), 10);
      showSlide(slideIndex);
      startAutoSlide();
    });
  });

  const carouselElement = document.getElementById('hero-carousel');
  if (carouselElement) {
    carouselElement.addEventListener('mouseenter', stopAutoSlide);
    carouselElement.addEventListener('mouseleave', startAutoSlide);
  }

  startAutoSlide();
}

// ==========================================================================
// TESTIMONIALS FILTER CONTROLLER
// ==========================================================================
function initTestimonialsFilter() {
  testimonialTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      testimonialTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      testimonialCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });
}

// ==========================================================================
// BOOKING MODAL & CONTACT FORM
// ==========================================================================
function initBookingModal() {
  openBookingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Smooth scroll to contact form or show modal
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        const nameInput = document.getElementById('student-name');
        if (nameInput) setTimeout(() => nameInput.focus(), 600);
      }
    });
  });

  if (contactBookingForm) {
    contactBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentName = document.getElementById('student-name').value;
      
      // Show confirmation modal
      if (bookingModal) {
        bookingModal.classList.add('active');
        bookingModal.setAttribute('aria-hidden', 'false');
      }

      contactBookingForm.reset();
      showToast(`Pendaftaran untuk ${studentName} berhasil dikirim!`);
    });
  }

  function closeModal() {
    if (bookingModal) {
      bookingModal.classList.remove('active');
      bookingModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOkBtn) modalOkBtn.addEventListener('click', closeModal);

  if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) {
        closeModal();
      }
    });
  }
}

// ==========================================================================
// MOBILE NAVIGATION
// ==========================================================================
function initMobileNav() {
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }
}

// ==========================================================================
// TOAST UTILITY
// ==========================================================================
function showToast(message) {
  if (!toastNotification) return;
  toastNotification.textContent = message;
  toastNotification.classList.add('show');
  setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 3500);
}


