"use strict";

class BaseHelpers {
  static html = document.documentElement;

  static addLoadedClass() {
    const trigger = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.html.classList.add("loaded");
        });
      });
    };

    if (document.readyState === "complete") {
      trigger();
    } else {
      window.addEventListener("load", trigger);
    }
  }
}

BaseHelpers.addLoadedClass();

// Universal image load detection for .img-wrap shimmer placeholders
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".img-wrap").forEach(function (wrap) {
    const img = wrap.querySelector("img");
    if (!img) return;

    var markLoaded = function () {
      wrap.classList.add("img-loaded");
    };

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener("load", markLoaded);
      img.addEventListener("error", markLoaded);
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const header = document.getElementById("header");
  const heroSection = document.getElementById("hero");

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const saved = localStorage.getItem("theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // Header scroll + progress bar (throttled via rAF)
  const progressBar = document.querySelector(".header__progress");
  if (header) {
    let docHeight = 0;
    let scrollTicking = false;

    const updateDimensions = () => {
      docHeight = document.documentElement.scrollHeight - window.innerHeight;
    };

    const onScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        header.classList.toggle("is-scrolled", scrollY > 10);

        if (progressBar && docHeight > 0) {
          progressBar.style.width = Math.min((scrollY / docHeight) * 100, 100) + "%";
        }
        scrollTicking = false;
      });
    };

    window.addEventListener("resize", updateDimensions, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    updateDimensions();
    onScroll();
  }

  // Mobile burger
  const burger = document.getElementById("navBurger");
  const navMenu = document.getElementById("navMenu");
  if (burger && navMenu) {
    burger.addEventListener("click", function () {
      this.classList.toggle("is-active");
      navMenu.classList.toggle("is-active");
      document.documentElement.classList.toggle("lock");
    });
    navMenu.querySelectorAll(".nav__link").forEach((link) => {
      link.addEventListener("click", () => {
        burger.classList.remove("is-active");
        navMenu.classList.remove("is-active");
        document.documentElement.classList.remove("lock");
      });
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const id = this.getAttribute("href");

      if (id === "#") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        return;
      }

      const el = document.querySelector(id);
      if (el) {
        const headerH = header ? 64 : 0;
        const targetTop = el.getBoundingClientRect().top + window.pageYOffset;
        const scrollTarget = Math.max(0, targetTop - headerH);

        window.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        });
      }
    });
  });

  // Scroll reveal — minimal IntersectionObserver, fires once per element
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObs.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -40px 0px", threshold: 0 }
  );
  document.querySelectorAll(".anim-on-scroll").forEach((el) => revealObs.observe(el));

  // Stats counter animation (IntersectionObserver — fires once, no scroll listener)
  const statNumbers = document.querySelectorAll(".stats__number[data-count]");
  if (statNumbers.length) {
    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.getAttribute("data-count"), 10);
          const suffix =
            target >= 100 && target !== 100 ? "+" : target === 100 ? "%" : "+";
          const duration = 2000;
          const startTime = performance.now();

          const easeOut = (t) => 1 - Math.pow(1 - t, 3);

          function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOut(progress);
            const current = Math.round(easedProgress * target);
            el.textContent = current + suffix;

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
          counterObs.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );

    statNumbers.forEach((el) => counterObs.observe(el));
  }

  // Gallery Swiper
  if (
    typeof Swiper !== "undefined" &&
    document.querySelector(".gallery-swiper")
  ) {
    new Swiper(".gallery-swiper", {
      slidesPerView: 1.2,
      spaceBetween: 16,
      grabCursor: true,
      navigation: {
        nextEl: ".gallery-next",
        prevEl: ".gallery-prev",
      },
      breakpoints: {
        576: { slidesPerView: 2.2 },
        992: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
  }

  // Gallery Lightbox
  const galleryItems = document.querySelectorAll(".gallery__item img");
  if (galleryItems.length > 0) {
    const lightboxHTML = `
			<div class="lightbox" id="lightbox">
				<div class="lightbox__content">
					<div class="lightbox__close" id="lightboxClose"></div>
					<img src="" alt="Gallery Full" id="lightboxImg">
				</div>
			</div>
		`;
    document.body.insertAdjacentHTML("beforeend", lightboxHTML);

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxClose = document.getElementById("lightboxClose");

    galleryItems.forEach((img) => {
      img.addEventListener("click", function () {
        lightboxImg.src = this.src;
        lightbox.classList.add("is-active");
        document.documentElement.classList.add("lock");
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove("is-active");
      document.documentElement.classList.remove("lock");
      setTimeout(() => {
        lightboxImg.src = "";
      }, 300);
    };

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === this) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("is-active"))
        closeLightbox();
    });
  }

  // Service cards (mobile flip)
  const serviceCards = document.querySelectorAll(".services__card");
  if (serviceCards.length > 0) {
    serviceCards.forEach((card) => {
      card.addEventListener("click", function () {
        if (window.innerWidth < 992) {
          serviceCards.forEach((c) => {
            if (c !== this) c.classList.remove("is-flipped");
          });
          this.classList.toggle("is-flipped");
        }
      });
    });
  }

  // Service modal close (legacy)
  const serviceModal = document.getElementById("serviceModal");
  const serviceModalOverlay = document.getElementById("serviceModalOverlay");
  const serviceModalClose = document.getElementById("serviceModalClose");
  const serviceModalImg = document.getElementById("serviceModalImg");

  const closeServiceModal = () => {
    if (serviceModal) {
      serviceModal.classList.remove("is-active");
      document.documentElement.classList.remove("lock");
      setTimeout(() => {
        if (serviceModalImg) serviceModalImg.src = "";
      }, 300);
    }
  };

  if (serviceModalClose)
    serviceModalClose.addEventListener("click", closeServiceModal);
  if (serviceModalOverlay)
    serviceModalOverlay.addEventListener("click", closeServiceModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && serviceModal && serviceModal.classList.contains("is-active"))
      closeServiceModal();
  });

  // Sticky CTA (IntersectionObserver — no scroll listener)
  const stickyCta = document.getElementById("stickyCta");
  if (stickyCta && heroSection) {
    const stickyObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          stickyCta.classList.toggle("is-visible", !entry.isIntersecting);
        });
      },
      { threshold: 0 },
    );
    stickyObs.observe(heroSection);
  }

  // Marquee pause when off-screen (IntersectionObserver)
  const marqueeTrack = document.querySelector(".billing__marquee-track");
  if (marqueeTrack) {
    const marqueeObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          marqueeTrack.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
        });
      },
      { threshold: 0 },
    );
    marqueeObs.observe(marqueeTrack.closest(".billing__marquee") || marqueeTrack);
  }
});
