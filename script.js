// Minimal JS to navigate between the pages and handle login/signup -> homepage flow.
// Stores a lightweight "session" in localStorage (email) and derives a display name
// so the homepage can show a user name. Also provides a small user menu and simple
// interactions for the demo.

(function () {
  // Utility: derive display name from email or fallback
  function displayNameFromEmail(email) {
    if (!email) return 'User';
    const before = email.split('@')[0] || email;
    // replace separators with spaces and capitalize words
    return before.replace(/[._\-+]+/g, ' ')
        .split(' ')
        .map(s => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '')
        .join(' ')
        .trim() || 'User';
  }

  // Save a "session" with the email value
  function saveSession(email) {
    if (!email) return;
    localStorage.setItem('petlink_user_email', email);
  }

  // Clear session
  function clearSession() {
    localStorage.removeItem('petlink_user_email');
  }

  // Get session
  function getSessionEmail() {
    return localStorage.getItem('petlink_user_email');
  }

  // Small helpers for navigation that work on file:// and http
  function goTo(path) {
    location.href = path;
  }

  // Attach handlers depending on which page is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Index: toLogin / toSignup buttons already link using location in original markup,
    // so nothing required here. But we keep anchors if present.
    const toLogin = document.getElementById('toLogin');
    const toSignup = document.getElementById('toSignup');

    if (toLogin) toLogin.addEventListener('click', () => { goTo('login.html'); });
    if (toSignup) toSignup.addEventListener('click', () => { goTo('signup.html'); });

    // Login page handlers
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e){
        e.preventDefault();
        const email = (document.getElementById('email')?.value || '').trim();
        // In a real app, you'd authenticate with a backend here.
        if (!email) {
          alert('Please enter your email.');
          return;
        }
        saveSession(email);
        // redirect to homepage after login
        goTo('homepage.html');
      });
    }

    // Signup page handlers
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', function(e){
        e.preventDefault();
        const email = (document.getElementById('s_email')?.value || '').trim();
        if (!email) {
          alert('Please enter your email.');
          return;
        }
        saveSession(email);
        // redirect to homepage after signup
        goTo('homepage.html');
      });
    }

    // Buttons that navigate from login/signup to the other
    const gotoSignup = document.getElementById('gotoSignup');
    if (gotoSignup) gotoSignup.addEventListener('click', () => { goTo('signup.html'); });

    const gotoLogin = document.getElementById('gotoLogin');
    if (gotoLogin) gotoLogin.addEventListener('click', () => { goTo('login.html'); });

    // Homepage specific behavior
    // If we're on homepage.html, show user's name and wire up controls.
    const onHomepage = location.pathname.endsWith('homepage.html') || location.href.endsWith('homepage.html');
    if (onHomepage) {
      const email = getSessionEmail();
      if (!email) {
        // If no user session, send back to login
        goTo('login.html');
        return;
      }

      const userNameEl = document.getElementById('userName');
      if (userNameEl) userNameEl.textContent = displayNameFromEmail(email);

      // Small user menu toggle
      const hpUser = document.getElementById('hpUser');
      const userMenu = document.getElementById('userMenu');
      if (hpUser && userMenu) {
        hpUser.addEventListener('click', () => {
          const hidden = userMenu.getAttribute('aria-hidden') === 'true';
          userMenu.style.display = hidden ? 'flex' : 'none';
          userMenu.setAttribute('aria-hidden', (!hidden).toString());
        });
        // Close when clicking outside
        document.addEventListener('click', (e) => {
          if (!hpUser.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.style.display = 'none';
            userMenu.setAttribute('aria-hidden', 'true');
          }
        });
      }

      // menu actions
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          clearSession();
          goTo('index.html');
        });
      }

      const gotoProfile = document.getElementById('gotoProfile');
      if (gotoProfile) gotoProfile.addEventListener('click', () => {
        alert('Profile page placeholder — implement profile.html to view/edit user profile.');
      });

      // Cards actions (placeholders)
      const createPet = document.getElementById('createPet');
      if (createPet) createPet.addEventListener('click', () => {
        alert('Create Pet Profile — placeholder. Implement create-pet.html to create new pet profiles.');
      });

      const myPets = document.getElementById('myPets');
      if (myPets) myPets.addEventListener('click', () => {
        alert('My Pets — placeholder. Implement my-pets.html to view pets.');
      });

      const dailyCare = document.getElementById('dailyCare');
      if (dailyCare) dailyCare.addEventListener('click', () => {
        alert('Daily Care — placeholder. Implement daily-care.html to manage routines and reminders.');
      });

      // Next care area: simple demo state stored in localStorage under "petlink_nextcare"
      const defaultNextCare = { name: 'Feeding', time: '9 am', icon: '🍲' };
      let nextCare = null;
      try {
        const stored = localStorage.getItem('petlink_nextcare');
        nextCare = stored ? JSON.parse(stored) : defaultNextCare;
      } catch (err) {
        nextCare = defaultNextCare;
      }

      // If there is no nextCare saved (first time), set default
      if (!nextCare) {
        nextCare = defaultNextCare;
        localStorage.setItem('petlink_nextcare', JSON.stringify(nextCare));
      }

      // Populate the DOM
      const nextCareName = document.getElementById('nextCareName');
      const nextCareTime = document.getElementById('nextCareTime');
      const nextCareIcon = document.querySelector('.hp-nextcare-icon');

      if (nextCareName) nextCareName.textContent = nextCare.name;
      if (nextCareTime) nextCareTime.textContent = nextCare.time;
      if (nextCareIcon) nextCareIcon.textContent = nextCare.icon || '🍽';

      // Dismiss button removes next care from storage for demo purposes
      const dismissCare = document.getElementById('dismissCare');
      if (dismissCare) {
        dismissCare.addEventListener('click', () => {
          localStorage.removeItem('petlink_nextcare');
          // simple UI feedback
          if (nextCareName) nextCareName.textContent = 'No upcoming care';
          if (nextCareTime) nextCareTime.textContent = '';
          if (nextCareIcon) nextCareIcon.textContent = '✅';
        });
      }
    }
  });
})();