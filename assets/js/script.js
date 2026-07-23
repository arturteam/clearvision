"use strict";

const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const screenshotButtons = [...document.querySelectorAll(".screenshots-grid .screenshot-card")];
const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const closeButton = modal?.querySelector(".image-modal-close");
const prevButton = modal?.querySelector(".image-modal-prev");
const nextButton = modal?.querySelector(".image-modal-next");

let currentIndex = 0;

function showImage(index) {
  if (!modalImage || screenshotButtons.length === 0) return;

  currentIndex = (index + screenshotButtons.length) % screenshotButtons.length;

  const image = screenshotButtons[currentIndex].querySelector("img");

  if (!image) return;

  modalImage.src = image.src;
  modalImage.alt = image.alt;
}

function openModal(index) {
  if (!modal) return;

  showImage(index);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal || !modalImage) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modalImage.src = "";
  document.body.style.overflow = "";
}

screenshotButtons.forEach((button, index) => {
  button.addEventListener("click", () => openModal(index));
});

prevButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  showImage(currentIndex - 1);
});

nextButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  showImage(currentIndex + 1);
});

closeButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeModal();
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (!modal?.classList.contains("is-open")) return;

  if (event.key === "Escape") closeModal();
  if (event.key === "ArrowLeft") showImage(currentIndex - 1);
  if (event.key === "ArrowRight") showImage(currentIndex + 1);
});