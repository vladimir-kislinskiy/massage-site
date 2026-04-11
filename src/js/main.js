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

// ── Smooth image reveal: scale-in + shimmer → fade-in (vkys.ca pattern) ──
document.addEventListener("DOMContentLoaded", function () {
  const wraps = document.querySelectorAll(".img-wrap");
  if (!wraps.length) return;

  // Step 1: Scale the container into view via IntersectionObserver
  const revealObs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("img-revealed");
        revealObs.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -40px 0px", threshold: 0.15 }
  );

  wraps.forEach(function (wrap) {
    revealObs.observe(wrap);

    // Step 2: Fade in the actual image once loaded
    const img = wrap.querySelector("img");
    if (!img) return;

    var markLoaded = function () {
      wrap.classList.add("img-loaded");
    };

    if (img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(markLoaded);
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

  // Header scroll + progress bar
  const progressBar = document.querySelector(".header__progress");
  if (header) {
    let docHeight = 0;
    const updateDimensions = () => {
      docHeight = document.documentElement.scrollHeight - window.innerHeight;
    };
    
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 10);

      if (progressBar && docHeight > 0) {
        const scrollTop = window.scrollY;
        const percent = (scrollTop / docHeight) * 100;
        progressBar.style.width = Math.min(percent, 100) + "%";
      }
    };

    window.addEventListener("resize", updateDimensions, { passive: true });
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateDimensions();
    updateHeader();
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
        // Ensure scroll target is not negative to prevent jitter
        const scrollTarget = Math.max(0, targetTop - headerH);
        
        window.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        });
      }
    });
  });

  // Hero parallax
  const parallaxBg = document.querySelector("[data-parallax]");
  if (parallaxBg && heroSection) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrolled = window.scrollY;
            const heroH = heroSection.offsetHeight;
            if (scrolled < heroH) {
              parallaxBg.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  // Scroll animations (sections)
  const animEls = document.querySelectorAll(".anim-on-scroll");
  if (animEls.length) {
    // Group elements by their parent section for stagger counting
    const sectionMap = new Map();
    animEls.forEach((el) => {
      const section =
        el.closest("section") || el.closest(".container") || el.parentElement;
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section).push(el);
    });

    const STAGGER_MS = 120;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;

          // Skip if already animated
          if (el.classList.contains("is-visible") || el.classList.contains("is-queued")) return;

          // Find which section group this element belongs to
          const section =
            el.closest("section") ||
            el.closest(".container") ||
            el.parentElement;
          const siblings = sectionMap.get(section) || [el];

          // Count how many siblings are already visible/queued (for stagger offset)
          let visibleCount = 0;
          for (let i = 0; i < siblings.length; i++) {
            if (siblings[i] === el) break;
            if (
              siblings[i].classList.contains("is-visible") ||
              siblings[i].classList.contains("is-queued")
            ) {
              if (!siblings[i].hasAttribute("data-delay")) {
                visibleCount++;
              }
            }
          }

          el.classList.add("is-queued");

          if (el.hasAttribute("data-delay")) {
            el.style.setProperty(
              "--anim-delay",
              `${el.getAttribute("data-delay")}ms`
            );
          } else {
            el.style.setProperty(
              "--anim-delay",
              `${visibleCount * STAGGER_MS}ms`
            );
          }

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.classList.add("is-visible");
              obs.unobserve(el);
            });
          });
        });
      },
      {
        rootMargin: "0px 0px -60px 0px",
        threshold: 0.08,
      },
    );

    setTimeout(() => {
      animEls.forEach((el) => obs.observe(el));
    }, 60);
  }

  // Stats counter animation
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

    const gallerySlides = document.querySelectorAll(".gallery__item");
    if (gallerySlides.length) {
      const SLIDE_STAGGER = 100;
      const slideObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gallerySlides.forEach((slide, i) => {
              if (slide.classList.contains("is-visible")) return;
              slide.style.setProperty(
                "--slide-delay",
                `${i * SLIDE_STAGGER}ms`,
              );
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  slide.classList.add("is-visible");
                });
              });
            });
            slideObs.disconnect();
          });
        },
        { rootMargin: "0px 0px -40px 0px", threshold: 0.1 },
      );

      slideObs.observe(
        document.querySelector(".gallery__slider") || gallerySlides[0],
      );
    }
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

  // Service Modal
  const serviceCards = document.querySelectorAll(".services__card");
  const serviceModal = document.getElementById("serviceModal");
  const serviceModalOverlay = document.getElementById("serviceModalOverlay");
  const serviceModalClose = document.getElementById("serviceModalClose");
  const serviceModalImg = document.getElementById("serviceModalImg");

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

  // Sticky CTA
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

  // JS 3D tilt removed. Using CSS scale.
});
