// Unified frontend script for the PetLink prototype.
// Handles navigation and page-specific behavior for:
// index, login, signup, homepage, create-pet, my-pets, pet-profile, health-records,
// appointments, memories, add-memory, daily-care integration.
//

(function () {
  // Helpers
  function displayNameFromEmail(email) {
    if (!email) return 'User';
    const before = email.split('@')[0] || email;
    return before.replace(/[._+\-]+/g, ' ')
        .split(' ')
        .map(s => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '')
        .join(' ')
        .trim() || 'User';
  }

  function saveSession(email) { if (!email) return; localStorage.setItem('petlink_user_email', email); }
  function clearSession() { localStorage.removeItem('petlink_user_email'); }
  function getSessionEmail() { return localStorage.getItem('petlink_user_email'); }

  function loadPets() { try { const raw = localStorage.getItem('petlink_pets'); return raw ? JSON.parse(raw) : []; } catch(e){ return []; } }
  function savePets(arr) { try { localStorage.setItem('petlink_pets', JSON.stringify(arr)); } catch(e){ console.error(e); } }

  function goTo(path) { location.href = path; }

  function safeSubmitForm(form) {
    if (!form) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else {
      const ev = new Event('submit', { bubbles:true, cancelable:true });
      form.dispatchEvent(ev);
    }
  }

  // Open daily care for a pet (fallback to first pet or create flow)
  function openDailyCareForPet(petId) {
    const pets = loadPets();
    if (petId) {
      goTo('daily-care.html?id=' + encodeURIComponent(petId));
      return;
    }
    if (pets && pets.length) {
      goTo('daily-care.html?id=' + encodeURIComponent(pets[0].id));
      return;
    }
    // No pets yet: go to create pet
    goTo('create-pet.html');
  }

  // DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Index page navigation
    const toLogin = document.getElementById('toLogin');
    const toSignup = document.getElementById('toSignup');
    if (toLogin) toLogin.addEventListener('click', () => goTo('login.html'));
    if (toSignup) toSignup.addEventListener('click', () => goTo('signup.html'));

    // Login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e){
        e.preventDefault();
        const email = (document.getElementById('email')?.value || '').trim();
        if (!email) { alert('Please enter your email.'); return; }
        saveSession(email);
        goTo('homepage.html');
      });
    }

    // Signup page
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', function(e){
        e.preventDefault();
        const email = (document.getElementById('s_email')?.value || '').trim();
        if (!email) { alert('Please enter your email.'); return; }
        saveSession(email);
        goTo('homepage.html');
      });
    }

    // helper jumpers between login/signup
    const gotoSignup = document.getElementById('gotoSignup'); if (gotoSignup) gotoSignup.addEventListener('click', () => goTo('signup.html'));
    const gotoLogin = document.getElementById('gotoLogin'); if (gotoLogin) gotoLogin.addEventListener('click', () => goTo('login.html'));

    // Demo test-fill handlers (login page)
    const testFillBtns = document.querySelectorAll('.test-fill');
    const testFillLoginBtns = document.querySelectorAll('.test-fill-login');
    function fillLoginFields(email, password) {
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      if (emailInput) emailInput.value = email || '';
      if (passInput) passInput.value = password || '';
    }
    testFillBtns.forEach(btn => btn.addEventListener('click', () => fillLoginFields(btn.getAttribute('data-email')||'', btn.getAttribute('data-password')||'')));
    testFillLoginBtns.forEach(btn => btn.addEventListener('click', () => {
      fillLoginFields(btn.getAttribute('data-email')||'', btn.getAttribute('data-password')||'');
      if (loginForm) safeSubmitForm(loginForm);
      else { saveSession(btn.getAttribute('data-email')||''); goTo('homepage.html'); }
    }));

    // HOMEPAGE logic
    const onHomepage = location.pathname.endsWith('homepage.html') || location.href.endsWith('homepage.html');
    if (onHomepage) {
      const email = getSessionEmail();
      if (!email) { goTo('login.html'); return; }
      const userNameEl = document.getElementById('userName');
      if (userNameEl) userNameEl.textContent = displayNameFromEmail(email);

      // user menu toggle
      const hpUser = document.getElementById('hpUser');
      const userMenu = document.getElementById('userMenu');
      if (hpUser && userMenu) {
        hpUser.addEventListener('click', () => {
          const hidden = userMenu.getAttribute('aria-hidden') === 'true';
          userMenu.style.display = hidden ? 'flex' : 'none';
          userMenu.setAttribute('aria-hidden', (!hidden).toString());
        });
        document.addEventListener('click', (e) => {
          if (!hpUser.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.style.display = 'none';
            userMenu.setAttribute('aria-hidden','true');
          }
        });
      }

      // menu actions
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', () => { clearSession(); goTo('index.html'); });

      const gotoProfile = document.getElementById('gotoProfile');
      if (gotoProfile) gotoProfile.addEventListener('click', () => alert('Profile placeholder'));

      // Cards navigation
      const createPet = document.getElementById('createPet');
      if (createPet) createPet.addEventListener('click', () => goTo('create-pet.html'));

      const myPets = document.getElementById('myPets');
      if (myPets) myPets.addEventListener('click', () => goTo('my-pets.html'));

      // DAILY CARE card on homepage: open daily care for first pet or fallback
      const dailyCareCard = document.getElementById('dailyCare');
      if (dailyCareCard) {
        dailyCareCard.addEventListener('click', () => {
          const pets = loadPets();
          if (pets && pets.length) {
            // prefer pet with nextcare if available
            try {
              const nc = JSON.parse(localStorage.getItem('petlink_nextcare') || 'null');
              if (nc && nc.petId) {
                goTo('daily-care.html?id=' + encodeURIComponent(nc.petId));
                return;
              }
            } catch(e){}
            goTo('daily-care.html?id=' + encodeURIComponent(pets[0].id));
          } else {
            goTo('create-pet.html');
          }
        });
      }

      // existing dailyCare var might have been used; ensure no conflict
      // Next care demo area: populate next care display (homepage already used same key)
      const defaultNextCare = { name: 'Feeding', time: '9 am', icon: '🍲' };
      let nextCare = null;
      try { const stored = localStorage.getItem('petlink_nextcare'); nextCare = stored ? JSON.parse(stored) : defaultNextCare; } catch(e){ nextCare = defaultNextCare; }
      if (!nextCare) { nextCare = defaultNextCare; localStorage.setItem('petlink_nextcare', JSON.stringify(nextCare)); }
      const nextCareName = document.getElementById('nextCareName');
      const nextCareTime = document.getElementById('nextCareTime');
      const nextCareIcon = document.querySelector('.hp-nextcare-icon');
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

    // CREATE-PET page
    const onCreatePet = location.pathname.endsWith('create-pet.html') || location.href.endsWith('create-pet.html');
    if (onCreatePet) {
      const petForm = document.getElementById('petForm');
      const cancelBtn = document.getElementById('cancelCreate');
      const imageInput = document.getElementById('petImageInput');

      if (cancelBtn) cancelBtn.addEventListener('click', () => goTo('my-pets.html'));

      if (petForm) {
        petForm.addEventListener('submit', function(e){
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
            reader.onload = function(ev) { addPetAndRedirect(ev.target.result); };
            reader.readAsDataURL(file);
          } else {
            addPetAndRedirect(null);
          }
        });
      }
    }

    // MY-PETS page
    const onMyPets = location.pathname.endsWith('my-pets.html') || location.href.endsWith('my-pets.html');
    if (onMyPets) {
      const email = getSessionEmail(); if (!email) { goTo('login.html'); return; }
      const mpUserName = document.getElementById('mpUserName') || document.getElementById('userName');
      if (mpUserName) mpUserName.textContent = displayNameFromEmail(email);

      const navHome = document.getElementById('navHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navDaily = document.getElementById('navDaily');
      if (navDaily) {
        navDaily.addEventListener('click', () => {
          // open daily care for the first pet (if any)
          const pets = loadPets();
          if (pets && pets.length) goTo('daily-care.html?id=' + encodeURIComponent(pets[0].id));
          else goTo('create-pet.html');
        });
      }

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
          card.setAttribute('role','button');
          card.setAttribute('tabindex','0');

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

    // PET-PROFILE page
    const onPetProfile = location.pathname.endsWith('pet-profile.html') || location.href.endsWith('pet-profile.html');
    if (onPetProfile) {
      function q(name){ const p = new URLSearchParams(location.search); return p.get(name); }
      const petId = q('id');
      const pets = loadPets();
      const pet = pets.find(p => p.id === petId);

      // Header nav wiring
      const navHome = document.getElementById('ppHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navMy = document.getElementById('ppMyPets'); if (navMy) navMy.addEventListener('click', () => goTo('my-pets.html'));
      const navDaily = document.getElementById('ppDaily'); if (navDaily) navDaily.addEventListener('click', () => {
        if (!petId) return;
        goTo('daily-care.html?id=' + encodeURIComponent(petId));
      });

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

      // Memories -> memories.html?id=petId
      const memBtn = document.getElementById('memories');
      if (memBtn) memBtn.addEventListener('click', () => {
        if (!petId) return;
        goTo('memories.html?id=' + encodeURIComponent(petId));
      });
    }

    // HEALTH-RECORDS page wiring (navDaily should go to daily-care for the same pet)
    const onHealthRecords = location.pathname.endsWith('health-records.html') || location.href.endsWith('health-records.html');
    if (onHealthRecords) {
      function q(name){ const p = new URLSearchParams(location.search); return p.get(name); }
      const petId = q('id');
      const navHome = document.getElementById('navHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navMy = document.getElementById('navMyPets'); if (navMy) navMy.addEventListener('click', () => goTo('my-pets.html'));
      const navDaily = document.getElementById('navDaily'); if (navDaily) navDaily.addEventListener('click', () => {
        if (petId) goTo('daily-care.html?id=' + encodeURIComponent(petId));
        else openDailyCareForPet();
      });
    }

    // APPOINTMENTS page wiring (navDaily + back to profile already handled in appointments.html, but provide safety)
    const onAppointments = location.pathname.endsWith('appointments.html') || location.href.endsWith('appointments.html');
    if (onAppointments) {
      function q(name){ const p = new URLSearchParams(location.search); return p.get(name); }
      const petId = q('id');
      const navHome = document.getElementById('navHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navMy = document.getElementById('navMyPets'); if (navMy) navMy.addEventListener('click', () => goTo('my-pets.html'));
      const navDaily = document.getElementById('navDaily'); if (navDaily) navDaily.addEventListener('click', () => {
        if (petId) goTo('daily-care.html?id=' + encodeURIComponent(petId));
        else openDailyCareForPet();
      });
    }

    // MEMORIES & ADD-MEMORY pages wiring are self-contained, but wire navDaily fallback
    const onMemories = location.pathname.endsWith('memories.html') || location.href.endsWith('memories.html');
    if (onMemories) {
      function q(name){ const p = new URLSearchParams(location.search); return p.get(name); }
      const petId = q('id');
      const navHome = document.getElementById('navHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navMy = document.getElementById('navMyPets'); if (navMy) navMy.addEventListener('click', () => goTo('my-pets.html'));
      const navDaily = document.getElementById('navDaily'); if (navDaily) navDaily.addEventListener('click', () => {
        if (petId) goTo('daily-care.html?id=' + encodeURIComponent(petId));
        else openDailyCareForPet();
      });
    }

    const onAddMemory = location.pathname.endsWith('add-memory.html') || location.href.endsWith('add-memory.html');
    if (onAddMemory) {
      function q(name){ const p = new URLSearchParams(location.search); return p.get(name); }
      const petId = q('id');
      const navHome = document.getElementById('navHome'); if (navHome) navHome.addEventListener('click', () => goTo('homepage.html'));
      const navMy = document.getElementById('navMyPets'); if (navMy) navMy.addEventListener('click', () => goTo('my-pets.html'));
      const navDaily = document.getElementById('navDaily'); if (navDaily) navDaily.addEventListener('click', () => {
        if (petId) goTo('daily-care.html?id=' + encodeURIComponent(petId));
        else openDailyCareForPet();
      });
    }

    // DAILY-CARE page doesn't need central wiring here (it updates petlink_nextcare itself),
    // but ensure homepage/pet-profile flows will pick up the petlink_nextcare key.

    // Expose helper globally so pages created separately can call it if needed
    window.petlink_openDailyCareForPet = openDailyCareForPet;
  });
})();