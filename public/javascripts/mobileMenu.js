const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  // Change the button icon based on the menu state
  if (navLinks.classList.contains("active")) {
    menuToggle.innerHTML = "&times;"; // Close icon
  } else {
    menuToggle.innerHTML = "&#9776;"; // Hamburger icon
  }
});
