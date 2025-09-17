let slideIndex = 1;
let slideTimer;

showSlides(slideIndex);
startAutoPlay();

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
  resetAutoPlay();
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
  resetAutoPlay();
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");

  if (n > slides.length) { slideIndex = 1 }
  if (n < 1) { slideIndex = slides.length }

  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active-dot");
  }

  slides[slideIndex - 1].style.display = "block";  
  dots[slideIndex - 1].classList.add("active-dot");
}

function startAutoPlay() {
  slideTimer = setInterval(function() {
    plusSlides(1);
  }, 20000); // 20 seconds
}

function resetAutoPlay() {
  clearInterval(slideTimer);
  startAutoPlay();
}