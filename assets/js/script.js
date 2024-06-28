'use strict';

/**
 * Navbar variables
 */
const navOpenBtn = document.querySelector("[data-menu-open-btn]");
const navCloseBtn = document.querySelector("[data-menu-close-btn]");
const navbar = document.querySelector("[data-navbar]");
const overlay = document.querySelector("[data-overlay]");

const navElemArr = [navOpenBtn, navCloseBtn, overlay];

navElemArr.forEach(elem => {
  elem.addEventListener("click", () => {
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");

    if (navbar.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  });
});

/**
 * Header sticky
 */
const header = document.querySelector("[data-header]");

window.addEventListener("scroll", () => {
  window.scrollY >= 10 ? header.classList.add("active") : header.classList.remove("active");
});

/**
 * Go top button
 */
const goTopBtn = document.querySelector("[data-go-top]");

window.addEventListener("scroll", () => {
  if (window.scrollY >= 500 && window.scrollY <= 3800) {
    goTopBtn.classList.add("active");
  } else {
    goTopBtn.classList.remove("active");
  }
});
