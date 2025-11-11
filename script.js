// Unified frontend script (updated)

(function () {
  // Helpers
  function displayNameFromEmail(email) {
    if (!email) return 'User';
    const before = email.split('@')[0] || email;
    return before.replace(/[._\-+]+/g, ' ')
        .split(' ')
        .map(s => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '')
        .join(' ')
        .trim() || 'User';
  }

  function saveSession(email) { if (!email) return; localStorage.setItem('petlink_user_email', email); }
  function clearSession() { localStorage.removeItem('petlink_user_email'); }
  function getSessionEmail() { return localStorage.getItem('petlink_user_email'); }

  function loadPets() { try { const raw = localStorage.getItem('petlink_pets'); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
  function savePets(arr) { try { localStorage.setItem('petlink_pets', JSON.stringify(arr)); } catch (e) { console.error(e); } }

  function goTo(path) { location.href = path; }

  function safeSubmitForm(form) {
    if (!form) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else {
      const ev = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(ev);
    }
  }

  // DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    // Index
    const toLogin = document.getElementById('toLogin');
    const toSignup = document.getElementById('toSignup');
    if (toLogin) toLogin.addEventListener('click', () => goTo('login.html'));
    if (toSignup) toSignup.addEventListener('click', () => goTo('signup.html'));

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = (document.getElementById('email')?.value || '').trim();
        if (!email) { alert('Please enter your email.'); return; }
        saveSession(email);
        goTo('homepage.html');
      });
    }

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = (document.getElementById('s_email')?.value || '').trim();
        if (!email) { alert('Please enter your email.'); return; }
        saveSession(email);
        goTo('homepage.html');
      });
    }

    // Inter-page jumpers
    const gotoSignup = document.getElementById('gotoSignup'); if (gotoSignup) gotoSignup.addEventListener('click', () => goTo('signup.html'));
    const gotoLogin = document.getElementById('gotoLogin'); if (gotoLogin) gotoLogin.addEventListener('click', () => goTo('login.html'));

    // Demo test-fill buttons (login page)
    const testFillBtns = document.querySelectorAll('.test-fill');
    const testFillLoginBtns = document.querySelectorAll('.test-fill-login');
    function fillLoginFields(email, password) {
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      if (emailInput) emailInput.value = email || '';
      if (passInput) passInput.value = password || '';
    }
    testFillBtns.forEach(btn => btn.addEventListener('click', () => fillLoginFields(btn.getAttribute('data-email') || '', btn.getAttribute('data-password') || '')));
    testFillLoginBtns.forEach(btn => btn.addEventListener('click', () => {
      fillLoginFields(btn.getAttribute('data-email') || '', btn.getAttribute('data-password') || '');
      if (loginForm) safeSubmitForm(loginForm);
      else { saveSession(btn.getAttribute('data-email') || ''); goTo('homepage.html'); }
    }));

    // Homepage
    const onHomepage = location.pathname.endsWith('homepage.html') || location.href.endsWith('homepage.html');
    if (onHomepage) {
      const email = getSessionEmail();
      if (!email) { goTo('login.html'); return; }
      const userNameEl = document.getElementById('userName'); if (userNameEl) userNameEl.textContent = displayNameFromEmail(email);

      const hpUser = document.getElementById('hpUser'); const userMenu = document.getElementById('userMenu');
      if (hpUser && userMenu) {
        hpUser.addEventListener('click', () => {
          const hidden = userMenu.getAttribute('aria-hidden') === 'true';
          userMenu.style.display = hidden ? 'flex' : 'none';
          userMenu.setAttribute('aria-hidden', (!hidden).toString());
        });
        document.addEventListener('click', (e) => {
          if (!hpUser.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.style.display = 'none';
            userMenu.setAttribute('aria-hidden', 'true');
          }
        });
      }

      const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.addEventListener('click', () => { clearSession(); goTo('index.html'); });
      const gotoProfile = document.getElementById('gotoProfile'); if (gotoProfile) gotoProfile.addEventListener('click', () => alert('Profile placeholder'));

      const createPet = document.getElementById('createPet'); if (createPet) createPet.addEventListener('click', () => goTo('create-pet.html'));
      const myPets = document.getElementById('myPets'); if (myPets) myPets.addEventListener('click', () => goTo('my-pets.html'));
      const dailyCare = document.getElementById('dailyCare'); if (dailyCare) dailyCare.addEventListener('click', () => alert('Daily Care placeholder'));

      // Next care demo
      const defaultNextCare = { name: 'Feeding', time: '9 am', icon: '🍲' };
      let nextCare = null;
      try { const stored = localStorage.getItem('petlink_nextcare'); nextCare = stored ? JSON.parse(stored) : defaultNextCare; } catch (e) { nextCare = defaultNextCare; }
      if (!nextCare) { nextCare = defaultNextCare; localStorage.setItem('petlink_nextcare', JSON.stringify(nextCare)); }
      const nextCareName = document.getElementById('nextCareName'); const nextCareTime = document.getElementById('nextCareTime'); const nextCareIcon = document.querySelector('.hp-nextcare-icon');
      if (nextCareName) nextCareName.textContent = nextCare.name;
      if (nextCareTime) nextCareTime.textContent = nextCare.time;
      if (nextCareIcon) nextCareIcon.textContent = nextCare.icon || '🍽';
      const dismissCare = document.getElementById('dismissCare');
      if (dismissCare) dismissCare.addEventListener('click', () => {
        localStorage.removeItem('petlink_nextcare');
        if (nextCareName) nextCareName.textContent = 'No upcoming care';
        if (nextCareTime) nextCareTime.textContent = '';
        if (nextCareIcon) nextCareIcon.textContent = '✅';
      });
    }

    // Create-pet
    const onCreatePet = location.pathname.endsWith('create-pet.html') || location.href.endsWith('create-pet.html');
    if (onCreatePet) {
      const petForm = document.getElementById('petForm');
      const cancelBtn = document.getElementById('cancelCreate');
      const imageInput = document.getElementById('petImageInput');

      if (cancelBtn) cancelBtn.addEventListener('click', () => goTo('my-pets.html'));

      if (petForm) {
        petForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const name = (document.getElementById('petName')?.value || '').trim();
          const breed = (document.getElementById('petBreed')?.value || '').trim();
          const age = (document.getElementById('petAge')?.value || '').trim();
          if (!name) { alert('Please enter a name for your pet.'); return; }

          const file = imageInput?.files?.[0];
          const addPetAndRedirect = (imageDataUrl) => {
            const pets = loadPets();
            const id = 'pet_' + Date.now();
            pets.push({
              id: id,
              name: name,
              breed: breed,
              ageMonths: age ? Number(age) : null,
              image: imageDataUrl || null,
              createdAt: new Date().toISOString()
            });
            savePets(pets);
            // After creating a pet, show its profile page
            goTo('pet-profile.html?id=' + encodeURIComponent(id));
          };

          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (ev) { addPetAndRedirect(ev.target.result); };
            reader.readAsDataURL(file);
          } else {
            addPetAndRedirect(null);
          }
        });
      }
    }

    // My-pets
    const onMyPets = location.pathname.endsWith('my-pets.html') || location.href.endsWith('my-pets.html');
    if (onMyPets) {
      const email = getSessionEmail(); if (!email) { goTo('login.html'); return; }
      const mpUserName = document.getElementById('mpUserName') || document.getElementById('userName'); if (mpUserName) mpUserName.textContent = displayNameFromEmail(email);
      const navHome = document.getElementById('navHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navDaily = document.getElementById('navDaily'); if (navDaily) navDaily.addEventListener('click', () => alert('Daily care placeholder'));

      const grid = document.getElementById('petsGrid');
      function formatAge(months) {
        if (!months && months !== 0) return '';
        const years = Math.floor(months / 12);
        if (years >= 1) return years + (years === 1 ? ' year old' : ' years old');
        return months + (months === 1 ? ' month old' : ' months old');
      }

      function render() {
        const pets = loadPets();
        grid.innerHTML = '';
        pets.forEach(p => {
          const card = document.createElement('article');
          card.className = 'pet-card';
          card.setAttribute('role', 'button');
          card.setAttribute('tabindex', '0');

          const imgWrap = document.createElement('div'); imgWrap.className = 'img-circle';
          const img = document.createElement('img'); img.alt = p.name || 'Pet'; img.src = p.image || 'images/default-pet.png';
          imgWrap.appendChild(img);

          const nameEl = document.createElement('div'); nameEl.className = 'pet-name'; nameEl.textContent = p.name || 'Unnamed';
          const breedEl = document.createElement('div'); breedEl.className = 'pet-meta'; breedEl.textContent = p.breed || '';
          const ageEl = document.createElement('div'); ageEl.className = 'pet-age'; ageEl.textContent = p.ageMonths ? formatAge(p.ageMonths) : '';

          card.appendChild(imgWrap); card.appendChild(nameEl); card.appendChild(breedEl); card.appendChild(ageEl);

          // Navigate to pet profile when clicked
          card.addEventListener('click', () => { goTo('pet-profile.html?id=' + encodeURIComponent(p.id)); });
          card.addEventListener('keypress', (e) => { if (e.key === 'Enter') goTo('pet-profile.html?id=' + encodeURIComponent(p.id)); });

          grid.appendChild(card);
        });

        const add = document.createElement('button');
        add.className = 'add-pet';
        add.innerHTML = '<div style="font-size:40px;">＋</div><div style="font-size:20px;">Add Pet</div>';
        add.addEventListener('click', () => goTo('create-pet.html'));
        grid.appendChild(add);
      }

      render();
    }

    // Pet-profile
    const onPetProfile = location.pathname.endsWith('pet-profile.html') || location.href.endsWith('pet-profile.html');
    if (onPetProfile) {
      function q(name) { const p = new URLSearchParams(location.search); return p.get(name); }
      const petId = q('id');
      const pets = loadPets();
      const pet = pets.find(p => p.id === petId);

      // show name/avatar handled inline in pet-profile.html, just wire the header/nav/actions
      const navHome = document.getElementById('ppHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navMy = document.getElementById('ppMyPets'); if (navMy) navMy.addEventListener('click', () => goTo('my-pets.html'));
      const navDaily = document.getElementById('ppDaily'); if (navDaily) navDaily.addEventListener('click', () => alert('Daily care — placeholder'));

      // Health records button -> health-records.html?id=petId
      const hrBtn = document.getElementById('healthRecords');
      if (hrBtn) hrBtn.addEventListener('click', () => {
        if (!petId) return;
        goTo('health-records.html?id=' + encodeURIComponent(petId));
      });

      // Appointments button -> appointments.html?id=petId
      const appBtn = document.getElementById('appointments');
      if (appBtn) appBtn.addEventListener('click', () => {
        if (!petId) return;
        goTo('appointments.html?id=' + encodeURIComponent(petId));
      });

      // Memories button -> memories.html?id=petId
      const memBtn = document.getElementById('memories');
      if (memBtn) memBtn.addEventListener('click', () => {
        if (!petId) return;
        goTo('memories.html?id=' + encodeURIComponent(petId));
      });

      // Memories / other buttons
      const hrButton = document.getElementById('healthRecords'); if (hrButton) {/* already wired above */}
      const memButton = document.getElementById('memories'); if (memButton) {/* already wired */}
    }



  });
})();