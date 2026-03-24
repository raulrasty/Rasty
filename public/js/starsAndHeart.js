const stars = document.querySelectorAll('.star-rating span');
const ratingInput = document.getElementById('ratingValue');

stars.forEach(star => {
  star.addEventListener('click', () => {
    const value = parseFloat(star.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });
});

function updateStars(value) {
  stars.forEach(star => {
    const starValue = parseFloat(star.dataset.value);
    if (starValue <= value) {
      star.classList.add('filled');
    } else {
      star.classList.remove('filled');
    }
  });
}

// Corazón
const heart = document.getElementById('heart');
const likedInput = document.getElementById('likedValue');

heart.addEventListener('click', () => {
  const liked = likedInput.value === 'true';
  likedInput.value = !liked;
  heart.classList.toggle('liked', !liked);
});