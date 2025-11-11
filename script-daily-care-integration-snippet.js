

//  open the first saved pet's daily care page (or my-pets/create-pet if none)
const dailyCare = document.getElementById('dailyCare');
if (dailyCare) {
  dailyCare.addEventListener('click', () => {
    const pets = (function(){ try { return JSON.parse(localStorage.getItem('petlink_pets')||'[]'); } catch(e){ return []; } })();
    if (pets && pets.length) {
      // navigate to the first pet's daily care page (you can adapt to prefer a "primary" pet)
      location.href = 'daily-care.html?id=' + encodeURIComponent(pets[0].id);
    } else {
      // no pets yet — send user to create or my-pets
      location.href = 'create-pet.html';
    }
  });
}

//  open the pet-specific daily care
const dailyCareBtn = document.getElementById('dailyCare'); // if present on pet-profile.html
if (dailyCareBtn) {
  // find current pet id from query param in pet-profile page
  const params = new URLSearchParams(location.search);
  const petId = params.get('id');
  if (petId) {
    dailyCareBtn.addEventListener('click', () => {
      location.href = 'daily-care.html?id=' + encodeURIComponent(petId);
    });
  }
}
