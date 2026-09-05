"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("current-year");
    if (year) year.textContent = String(new Date().getFullYear());

    document.querySelectorAll("[data-language]").forEach((link) => {
        link.addEventListener("click", () => localStorage.setItem("clearVisionLanguage", link.dataset.language));
    });

    const cards = Array.from(document.querySelectorAll(".screenshot-card"));
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    const closeButton = modal?.querySelector(".image-modal-close");
    const previousButton = modal?.querySelector(".image-modal-prev");
    const nextButton = modal?.querySelector(".image-modal-next");

    if (!cards.length || !modal || !modalImage) return;

    let currentIndex = 0;

    const showImage = (index) => {
        currentIndex = (index + cards.length) % cards.length;
        const image = cards[currentIndex].querySelector("img");
        if (!image) return;
        modalImage.src = image.src;
        modalImage.alt = image.alt;

        const sourceWidth = Number(image.getAttribute("width")) || image.naturalWidth || 0;
        const sourceHeight = Number(image.getAttribute("height")) || image.naturalHeight || 0;
        const isWide = sourceWidth > 0 && sourceHeight > 0 && (sourceWidth / sourceHeight) >= 1.45;
        modalImage.classList.toggle("is-wide", isWide);
    };

    const openModal = (index) => {
        showImage(index);
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeButton?.focus();
    };

    const closeModal = () => {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        cards[currentIndex]?.focus();
    };

    cards.forEach((card, index) => card.addEventListener("click", () => openModal(index)));
    closeButton?.addEventListener("click", closeModal);
    previousButton?.addEventListener("click", () => showImage(currentIndex - 1));
    nextButton?.addEventListener("click", () => showImage(currentIndex + 1));

    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
        if (!modal.classList.contains("is-open")) return;
        if (event.key === "Escape") closeModal();
        if (event.key === "ArrowLeft") showImage(currentIndex - 1);
        if (event.key === "ArrowRight") showImage(currentIndex + 1);
    });
});
