// Stagger card animations
document.querySelectorAll('.game-card').forEach((card, i) => {
  card.style.animationDelay = (i * 0.1) + 's';
});
