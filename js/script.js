const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const isHomePage = Boolean(document.querySelector("[data-home-scroll]"));
const scriptSrc = document.currentScript?.getAttribute("src") || "js/script.js";
const assetBasePath = scriptSrc.replace(/js\/script\.js(?:\?.*)?$/, "");
const logoPath = `${assetBasePath}img/loghi/VETTLOGO.svg`;
const preloadLogoPath = `${assetBasePath}img/loghi/VETTLOGO.svg`;
let stopHomeSmoothScroll = () => {};
let canStartHomeHorizontalScroll = () => true;
let moveHomeToAdjacentSlide = () => false;
let isHomeSmoothScrollSetup = false;
const isLikelyTrackpad = (event) => event.deltaMode === 0 && Math.abs(event.deltaY) < 65;

if (/(^|\/)realizzazioni\.html$/i.test(window.location.pathname)) {
  window.location.replace(`${assetBasePath}index.html#realizzazioni`);
}

if (/(^|\/)contatti\.html$/i.test(window.location.pathname)) {
  window.location.replace(`${assetBasePath}chi-siamo.html#contatti`);
}

document
  .querySelectorAll('.main-nav a[href$="realizzazioni.html"], .site-footer a[href$="realizzazioni.html"], .main-nav a[href$="contatti.html"], .site-footer a[href$="contatti.html"]')
  .forEach((link) => link.remove());

document.querySelectorAll(".brand").forEach((brand) => {
  if (!brand.querySelector("img")) {
    brand.insertAdjacentHTML("afterbegin", `<img src="${logoPath}" alt="" aria-hidden="true">`);
  }
  const brandInitials = brand.querySelector("span");
  if (brandInitials && brandInitials.textContent.trim().toUpperCase() === "AR") {
    brandInitials.remove();
  }
  Array.from(brand.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .forEach((node) => node.remove());
  brand.append(document.createTextNode(" Infissi e Serramenti"));
});

document.querySelectorAll(".site-header").forEach((header) => {
  const brand = header.querySelector(".brand");
  let madeInItaly = header.querySelector(".made-in-italy-pill");
  if (!madeInItaly && brand) {
    madeInItaly = document.createElement("span");
    madeInItaly.className = "made-in-italy-pill";
    brand.insertAdjacentElement("afterend", madeInItaly);
  }
  if (madeInItaly) {
    madeInItaly.innerHTML = '<span class="italy-flag" aria-hidden="true"></span>Made in Italy';
  }
});

const scrollProgress = document.createElement("span");
scrollProgress.className = "scroll-progress";
document.body.appendChild(scrollProgress);

window.addEventListener(
  "wheel",
  (event) => {
    document.body.classList.toggle("is-trackpad-scroll", isLikelyTrackpad(event));
  },
  { passive: true }
);

const updatePageChrome = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  document.querySelector(".site-header")?.classList.toggle("is-scrolled", window.scrollY > 18);
};

updatePageChrome();
window.addEventListener("scroll", updatePageChrome, { passive: true });

const setupCollapsiblePageHero = ({
  hero,
  pageClass,
  compactClass,
  titleAnimationDuration = 460,
  titleAnimationEasing = "cubic-bezier(0.65, 0, 0.35, 1)"
}) => {
  if (!hero) {
    return;
  }

  const gestureReleaseGap = 140;
  const title = hero.querySelector(":scope > h1, h1");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let isAnimating = false;
  let awaitingGestureRelease = false;
  let lastWheelTime = Number.NEGATIVE_INFINITY;
  let hasLeftPageStart = window.scrollY > 2;
  let transitionGeneration = 0;
  let titleCenteringAnimation = null;

  if (pageClass) {
    document.body.classList.add(pageClass);
  }

  if (hasLeftPageStart) {
    document.body.classList.add(compactClass);
  }

  const isAtPageStart = () => window.scrollY <= 2;
  const isCompact = () => document.body.classList.contains(compactClass);

  const setCompactState = (shouldCompact, { lockGesture = true } = {}) => {
    if (isCompact() === shouldCompact) {
      return;
    }

    transitionGeneration += 1;
    const currentGeneration = transitionGeneration;
    isAnimating = true;

    if (lockGesture) {
      awaitingGestureRelease = true;
    }

    const previousTitleRect = title?.getBoundingClientRect();
    document.body.classList.toggle(compactClass, shouldCompact);

    if (title && previousTitleRect && !reducedMotion) {
      const nextTitleRect = title.getBoundingClientRect();
      const shiftX = previousTitleRect.left + previousTitleRect.width / 2 - (nextTitleRect.left + nextTitleRect.width / 2);
      const shiftY = previousTitleRect.top + previousTitleRect.height / 2 - (nextTitleRect.top + nextTitleRect.height / 2);

      titleCenteringAnimation?.cancel();
      titleCenteringAnimation = title.animate(
        [
          { transform: `translate(${shiftX}px, ${shiftY}px)` },
          { transform: "translate(0, 0)" }
        ],
        {
          duration: titleAnimationDuration,
          easing: titleAnimationEasing
        }
      );
    }

    window.requestAnimationFrame(() => {
      const heightTransition = hero
        .getAnimations()
        .find((animation) => animation.transitionProperty === "height");

      if (!heightTransition) {
        if (currentGeneration === transitionGeneration) {
          isAnimating = false;
        }
        return;
      }

      const finishTransition = () => {
        if (currentGeneration === transitionGeneration) {
          isAnimating = false;
        }
      };

      heightTransition.finished.then(finishTransition, finishTransition);
    });
  };

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 2) {
        hasLeftPageStart = true;

        if (!isCompact() && !isAnimating) {
          setCompactState(true, { lockGesture: false });
        }
      } else if (hasLeftPageStart && isCompact() && !isAnimating) {
        hasLeftPageStart = false;
        setCompactState(false);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "scrollend",
    () => {
      if (hasLeftPageStart && isAtPageStart() && isCompact() && !isAnimating) {
        hasLeftPageStart = false;
        setCompactState(false);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "wheel",
    (event) => {
      const isVerticalScroll = Math.abs(event.deltaY) > Math.abs(event.deltaX);

      if (event.defaultPrevented || event.ctrlKey || !isVerticalScroll) {
        return;
      }

      const wheelTime = Number.isFinite(event.timeStamp) ? event.timeStamp : performance.now();
      const isNewGesture = wheelTime - lastWheelTime > gestureReleaseGap;
      lastWheelTime = wheelTime;

      if (isAnimating) {
        event.preventDefault();
        return;
      }

      if (awaitingGestureRelease) {
        if (!isNewGesture) {
          event.preventDefault();
          return;
        }

        awaitingGestureRelease = false;
      }

      if (event.deltaY > 0 && isAtPageStart() && !isCompact()) {
        event.preventDefault();
        hasLeftPageStart = false;
        setCompactState(true);
        return;
      }

      if (event.deltaY < 0 && isAtPageStart() && isCompact()) {
        event.preventDefault();
        hasLeftPageStart = false;
        setCompactState(false);
      }
    },
    { passive: false }
  );
};

setupCollapsiblePageHero({
  hero: document.querySelector(".products-page .product-page-hero"),
  compactClass: "is-product-hero-compact"
});

setupCollapsiblePageHero({
  hero: document.querySelector(".catalog-page-hero"),
  pageClass: "catalog-category-page",
  compactClass: "is-catalog-hero-compact"
});

setupCollapsiblePageHero({
  hero: document.querySelector(".quote-page-modern .estimate-compact-intro"),
  compactClass: "is-estimate-hero-compact",
  titleAnimationDuration: 620,
  titleAnimationEasing: "cubic-bezier(0.22, 1, 0.36, 1)"
});

const isElementAtViewportCenter = (element) => {
  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const centerY = window.innerHeight / 2;
  return rect.top <= centerY && rect.bottom >= centerY;
};

const isHomeSlideSettled = (element, tolerance = 18) => {
  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return Math.abs(rect.top) <= tolerance;
};

const getHomeSlideSnapY = (element) => {
  if (!element) {
    return window.scrollY;
  }

  const rect = element.getBoundingClientRect();
  return window.scrollY + rect.top;
};

const getHomeSlides = () => Array.from(document.querySelectorAll("[data-home-slide]"));

const getHomeSlideAtViewportCenter = () => {
  const centerY = window.innerHeight / 2;
  const slides = getHomeSlides();
  const centeredSlide = slides.find((slide) => isElementAtViewportCenter(slide));

  if (centeredSlide || !slides.length) {
    return centeredSlide || null;
  }

  return slides.reduce((closestSlide, slide) => {
    const rect = slide.getBoundingClientRect();
    const slideCenter = rect.top + rect.height / 2;
    const closestRect = closestSlide.getBoundingClientRect();
    const closestCenter = closestRect.top + closestRect.height / 2;

    return Math.abs(slideCenter - centerY) < Math.abs(closestCenter - centerY)
      ? slide
      : closestSlide;
  });
};

const getAdjacentHomeSlide = (slide, normalizedDelta) => {
  const slides = getHomeSlides();
  const currentIndex = slides.indexOf(slide);

  if (currentIndex < 0) {
    return null;
  }

  return slides[currentIndex + (normalizedDelta > 0 ? 1 : -1)] || null;
};

const isHomeProductHorizontalReady = (element) => (
  element?.classList.contains("home-slide-products")
  && getHomeSlideAtViewportCenter() === element
  && isHomeSlideSettled(element, 48)
);

const setupSmoothHomeScroll = () => {
  const desktopHomeLayout = window.matchMedia("(min-width: 861px)");

  if (!isHomePage || !desktopHomeLayout.matches) {
    return;
  }

  if (isHomeSmoothScrollSetup) {
    return stopHomeSmoothScroll;
  }

  isHomeSmoothScrollSetup = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gestureReleaseGap = 360;
  let wheelIntentDistance = 0;
  let wheelIntentDirection = 0;
  let lastWheelInputAt = -Infinity;
  let isAnimating = false;
  let awaitingGestureRelease = false;
  let targetSlide = null;
  let transitionFrame = null;
  let settledFrames = 0;
  let lastTransitionInvolvedWorks = false;

  const clearWheelIntent = () => {
    wheelIntentDistance = 0;
    wheelIntentDirection = 0;
  };

  const resetWheelIntent = () => {
    clearWheelIntent();
    lastWheelInputAt = -Infinity;
    awaitingGestureRelease = false;
    lastTransitionInvolvedWorks = false;
  };

  const completeTransition = () => {
    transitionFrame = null;
    targetSlide = null;
    settledFrames = 0;
    isAnimating = false;
  };

  const monitorTransition = () => {
    settledFrames = targetSlide && isHomeSlideSettled(targetSlide)
      ? settledFrames + 1
      : 0;

    if (settledFrames >= 2) {
      completeTransition();
      return;
    }

    transitionFrame = window.requestAnimationFrame(monitorTransition);
  };

  moveHomeToAdjacentSlide = (direction) => {
    if (isAnimating) {
      return true;
    }

    const activeSlide = getHomeSlideAtViewportCenter();
    const adjacentSlide = activeSlide ? getAdjacentHomeSlide(activeSlide, direction) : null;
    if (!adjacentSlide) {
      return false;
    }

    clearWheelIntent();
    lastWheelInputAt = performance.now();
    isAnimating = true;
    awaitingGestureRelease = true;
    targetSlide = adjacentSlide;
    lastTransitionInvolvedWorks = activeSlide.classList.contains("home-slide-works")
      || adjacentSlide.classList.contains("home-slide-works");
    settledFrames = 0;
    adjacentSlide.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    transitionFrame = window.requestAnimationFrame(monitorTransition);
    return true;
  };

  canStartHomeHorizontalScroll = () => {
    if (isAnimating) {
      return false;
    }

    if (!awaitingGestureRelease) {
      return true;
    }

    const requiredReleaseGap = lastTransitionInvolvedWorks ? 720 : gestureReleaseGap;
    if (performance.now() - lastWheelInputAt < requiredReleaseGap) {
      return false;
    }

    awaitingGestureRelease = false;
    lastTransitionInvolvedWorks = false;
    clearWheelIntent();
    return true;
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.defaultPrevented || event.ctrlKey || document.body.classList.contains("intro-lock")) {
        return;
      }

      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      const wheelInputAt = performance.now();
      const timeSinceLastWheelInput = wheelInputAt - lastWheelInputAt;
      lastWheelInputAt = wheelInputAt;

      if (isAnimating) {
        event.preventDefault();
        return;
      }

      const activeSlide = getHomeSlideAtViewportCenter();
      const intentDirection = event.deltaY > 0 ? 1 : -1;
      const adjacentSlide = activeSlide
        ? getAdjacentHomeSlide(activeSlide, intentDirection)
        : null;

      if (!adjacentSlide) {
        resetWheelIntent();
        return;
      }

      event.preventDefault();

      if (awaitingGestureRelease) {
        const involvesWorksSlide = lastTransitionInvolvedWorks
          || activeSlide?.classList.contains("home-slide-works")
          || targetSlide?.classList.contains("home-slide-works");
        const requiredReleaseGap = involvesWorksSlide ? 720 : gestureReleaseGap;

        if (timeSinceLastWheelInput < requiredReleaseGap) {
          return;
        }
        awaitingGestureRelease = false;
        lastTransitionInvolvedWorks = false;
      }

      if (intentDirection !== wheelIntentDirection) {
        clearWheelIntent();
        wheelIntentDirection = intentDirection;
      }

      const normalizedDistance = event.deltaMode === 1
        ? Math.abs(event.deltaY) * 16
        : event.deltaMode === 2
          ? Math.abs(event.deltaY) * window.innerHeight
          : Math.abs(event.deltaY);
      const isWorksSlide = activeSlide?.classList.contains("home-slide-works");
      const intentThreshold = isWorksSlide
        ? (isLikelyTrackpad(event) ? 55 : 90)
        : (isLikelyTrackpad(event) ? 9 : 28);
      wheelIntentDistance += normalizedDistance;

      if (wheelIntentDistance < intentThreshold) {
        return;
      }

      clearWheelIntent();
      isAnimating = true;
      awaitingGestureRelease = true;
      targetSlide = adjacentSlide;
      lastTransitionInvolvedWorks = activeSlide.classList.contains("home-slide-works")
        || adjacentSlide.classList.contains("home-slide-works");
      settledFrames = 0;
      adjacentSlide.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      transitionFrame = window.requestAnimationFrame(monitorTransition);
    },
    { passive: false }
  );

  return resetWheelIntent;
};

if (isHomePage) {
  const homeFooter = document.querySelector("body > .site-footer");
  const lastHomeSlide = document.querySelector(".home-slide-contact");
  if (homeFooter && lastHomeSlide) {
    homeFooter.classList.add("home-slide-footer");
    lastHomeSlide.appendChild(homeFooter);
    updatePageChrome();
  }

  const intro = document.createElement("div");
  intro.className = "site-intro site-intro-minimal";
  intro.setAttribute("aria-hidden", "true");
  intro.innerHTML = `
    <div class="site-intro-signature">
      <span class="site-intro-eyebrow">Certaldo &middot; Toscana</span>
      <div class="site-intro-mark">
        <img src="${preloadLogoPath}" alt="">
      </div>
      <p><span>AR Infissi e Serramenti</span><small>Soluzioni su misura &middot; Made in Italy</small></p>
    </div>
    <span class="site-intro-progress"></span>
  `;

  document.body.classList.add("intro-lock");
  document.body.prepend(intro);
  window.requestAnimationFrame(() => intro.classList.add("is-ready"));

  window.setTimeout(() => {
    intro.classList.add("is-leaving");
  }, 1950);

  window.setTimeout(() => {
    intro.remove();
    document.body.classList.remove("intro-lock");
  }, 2750);
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const normalizePath = (href) => {
  const link = document.createElement("a");
  link.href = href;
  return link.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "");
};

const currentPath = window.location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "");

document.querySelectorAll(".main-nav a").forEach((link) => {
  const linkPath = normalizePath(link.getAttribute("href"));
  if (linkPath === currentPath || (currentPath.includes("/prodotti/") && link.textContent.trim() === "Prodotti")) {
    link.classList.add("is-active");
  }
});

if (window.location.pathname.includes("/prodotti/") && !document.querySelector(".product-back-link")) {
  const header = document.querySelector(".site-header");
  if (header) {
    const isCatalogDetail = Boolean(document.querySelector(".catalog-product-hero"));
    const isWindowDetail = isCatalogDetail && window.location.pathname.includes("/prodotti/finestre/");
    const isDoorDetail = isCatalogDetail && window.location.pathname.includes("/prodotti/porte/");
    const backHref = isWindowDetail
      ? `${assetBasePath}prodotti/finestre/`
      : isDoorDetail
        ? `${assetBasePath}prodotti/porte/`
        : `${assetBasePath}prodotti.html`;
    const backLabel = isCatalogDetail ? "Indietro al catalogo" : "Indietro ai prodotti";
    header.insertAdjacentHTML("afterend", `<a class="product-back-link" href="${backHref}">${backLabel}</a>`);
  }
}

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    document.querySelectorAll("[data-category]").forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

const quoteForm = document.querySelector("[data-quote-form]");

if (quoteForm && !quoteForm.querySelector("[data-quote-step]")) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = quoteForm.querySelector("[data-form-message]");
    if (message) {
      message.textContent = "Richiesta preparata correttamente. Il collegamento email/WhatsApp verrà configurato successivamente.";
    }
    quoteForm.reset();
  });
}

if (quoteForm?.querySelector("[data-quote-step]")) {
  const quoteSteps = Array.from(quoteForm.querySelectorAll("[data-quote-step]"));
  const quoteProgressItems = Array.from(document.querySelectorAll("[data-quote-progress-item]"));
  const quoteStepLabel = quoteForm.querySelector("[data-quote-step-label]");
  const quoteStepNumber = quoteForm.querySelector("[data-quote-step-number]");
  const quoteStepTitle = quoteForm.querySelector("[data-quote-current-title]");
  const quoteProgressBar = quoteForm.querySelector("[data-quote-progress-bar]");
  const quoteFileInput = quoteForm.querySelector("[data-quote-file]");
  const quoteFileStatus = quoteForm.querySelector("[data-file-status]");
  const quoteMessage = quoteForm.querySelector("[data-form-message]");
  const quoteBuilder = quoteForm.closest(".estimate-builder");
  const quoteTiming = quoteForm.elements.tempistica;
  let activeQuoteStep = 0;

  const setActiveQuoteStep = (nextStep, { bringIntoView = false } = {}) => {
    activeQuoteStep = Math.max(0, Math.min(nextStep, quoteSteps.length - 1));

    quoteSteps.forEach((step, index) => {
      const isActive = index === activeQuoteStep;
      step.classList.toggle("is-active", isActive);
      step.setAttribute("aria-hidden", String(!isActive));
    });

    quoteProgressItems.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeQuoteStep);
      item.classList.toggle("is-complete", index < activeQuoteStep);
    });

    const currentStep = quoteSteps[activeQuoteStep];
    const currentTitle = currentStep?.dataset.stepTitle || "Configura la richiesta";
    const formattedStep = String(activeQuoteStep + 1).padStart(2, "0");

    if (quoteStepLabel) {
      quoteStepLabel.textContent = `Passaggio ${activeQuoteStep + 1} di ${quoteSteps.length}`;
    }

    if (quoteStepNumber) {
      quoteStepNumber.textContent = formattedStep;
    }

    if (quoteStepTitle) {
      quoteStepTitle.textContent = currentTitle;
    }

    if (quoteProgressBar) {
      quoteProgressBar.style.width = `${((activeQuoteStep + 1) / quoteSteps.length) * 100}%`;
    }

    if (bringIntoView) {
      const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

      window.requestAnimationFrame(() => {
        quoteForm.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      });
    }
  };

  const validateQuoteStep = (step) => {
    const invalidField = Array.from(step?.querySelectorAll("input, select, textarea") || [])
      .find((field) => !field.checkValidity());

    if (!invalidField) {
      return true;
    }

    invalidField.reportValidity();
    invalidField.focus({ preventScroll: true });
    return false;
  };

  quoteForm.noValidate = true;
  quoteForm.classList.add("is-step-form");
  setActiveQuoteStep(0);

  quoteForm.querySelectorAll("[data-quote-next]").forEach((button) => {
    button.addEventListener("click", () => {
      if (validateQuoteStep(quoteSteps[activeQuoteStep])) {
        setActiveQuoteStep(activeQuoteStep + 1, { bringIntoView: true });
      }
    });
  });

  quoteForm.querySelectorAll("[data-quote-prev]").forEach((button) => {
    button.addEventListener("click", () => setActiveQuoteStep(activeQuoteStep - 1, { bringIntoView: true }));
  });

  quoteFileInput?.addEventListener("change", () => {
    if (!quoteFileStatus) {
      return;
    }

    const selectedFiles = quoteFileInput.files?.length || 0;
    quoteFileStatus.textContent = selectedFiles
      ? `${selectedFiles} ${selectedFiles === 1 ? "foto selezionata" : "foto selezionate"}`
      : "JPG o PNG, anche pi\u00f9 immagini";
  });

  const updateUrgentState = () => {
    quoteTiming?.classList.toggle("is-urgent", quoteTiming.value === "Urgente");
  };

  quoteTiming?.addEventListener("change", updateUrgentState);
  updateUrgentState();

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (quoteBuilder && finePointer.matches) {
    let pointerFrame = 0;

    quoteBuilder.addEventListener("pointermove", (event) => {
      if (pointerFrame) {
        window.cancelAnimationFrame(pointerFrame);
      }

      pointerFrame = window.requestAnimationFrame(() => {
        const bounds = quoteBuilder.getBoundingClientRect();
        quoteBuilder.style.setProperty("--quote-light-x", `${event.clientX - bounds.left}px`);
        quoteBuilder.style.setProperty("--quote-light-y", `${event.clientY - bounds.top}px`);
      });
    }, { passive: true });
  }

  quoteForm.addEventListener("input", () => {
    quoteForm.classList.remove("is-submitted");
    if (quoteMessage) {
      quoteMessage.textContent = "";
    }
  });

  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalidStepIndex = quoteSteps.findIndex((step) => {
      return Array.from(step.querySelectorAll("input, select, textarea"))
        .some((field) => !field.checkValidity());
    });

    if (invalidStepIndex >= 0) {
      setActiveQuoteStep(invalidStepIndex, { bringIntoView: true });
      window.requestAnimationFrame(() => validateQuoteStep(quoteSteps[invalidStepIndex]));
      return;
    }

    if (quoteMessage) {
      quoteMessage.textContent = "Richiesta preparata correttamente. Ti ricontatteremo per approfondire il progetto.";
    }

    quoteForm.classList.add("is-submitted");
    quoteForm.reset();
    updateUrgentState();
    setActiveQuoteStep(0);

    if (quoteFileStatus) {
      quoteFileStatus.textContent = "JPG o PNG, anche pi\u00f9 immagini";
    }
  });
}

const homeMobileLayout = window.matchMedia("(max-width: 640px)");

const syncHomeMobileEnhancements = () => {
  const storyText = document.querySelector(".home-slide-story .company-story-text");

  if (!isHomePage || !homeMobileLayout.matches) {
    document.querySelectorAll(".home-mobile-section-blend").forEach((blend) => blend.remove());
    document.querySelector(".home-story-mobile-toggle")?.remove();
    storyText?.classList.remove("is-mobile-collapsed", "is-mobile-expanded");
    return;
  }

  document.querySelectorAll("[data-home-slide]").forEach((slide, index) => {
    if (index === 0 || slide.querySelector(":scope > .home-mobile-section-blend")) return;

    const blend = document.createElement("span");
    blend.className = "home-mobile-section-blend";
    blend.setAttribute("aria-hidden", "true");
    slide.prepend(blend);
  });

  if (
    storyText
    && storyText.querySelectorAll(":scope > p").length > 2
    && !document.querySelector(".home-story-mobile-toggle")
  ) {
    storyText.classList.add("is-mobile-collapsed");
    const storyToggle = document.createElement("button");
    storyToggle.className = "home-story-mobile-toggle";
    storyToggle.type = "button";
    storyToggle.textContent = "Scopri di più";
    storyToggle.setAttribute("aria-expanded", "false");
    storyToggle.addEventListener("click", () => {
      const isExpanded = storyText.classList.toggle("is-mobile-expanded");
      storyToggle.textContent = isExpanded ? "Mostra meno" : "Scopri di più";
      storyToggle.setAttribute("aria-expanded", String(isExpanded));
    });
    storyText.insertAdjacentElement("afterend", storyToggle);
  }
};

syncHomeMobileEnhancements();
homeMobileLayout.addEventListener("change", syncHomeMobileEnhancements);

const productTransitionAssets = {
  window: "img/hero/casa-vetri-toscana.png",
  "interior-door": "img/catalogo/porte/OPERA_211QI.jpg",
  "heavy-door": "img/prodotti/card-porte-blindate.png",
  screen: "img/prodotti/card-zanzariere.png",
  shutters: "img/prodotti/card-persiane.png",
  roller: "img/prodotti/card-avvolgibili.png",
  grate: "img/prodotti/card-inferriate.png",
  "sliding-glass": "img/prodotti/card-scorrevoli-vetrate.png"
};

const setupSmoothHorizontalWheel = ({
  scroller,
  wheelTarget = scroller,
  activationElement = scroller,
  activationCheck,
  onUpdate,
  onBoundary,
  duration = 550,
  gestureReleaseGap = 120,
  continuous = false
}) => {
  const pages = Array.from(scroller.children).filter((element) => element.matches("a"));
  if (!pages.length) {
    return;
  }

  let pageTargets = [];
  let currentIndex = 0;
  let isAnimating = false;
  let awaitingGestureRelease = false;
  let animationFrame = null;
  let lastWheelInputAt = -Infinity;
  let continuousTargetScroll = scroller.scrollLeft;
  let boundaryIntentDistance = 0;
  let boundaryIntentDirection = 0;

  const getMaxScroll = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  const clampScroll = (value, maxScroll = getMaxScroll()) => Math.max(0, Math.min(maxScroll, value));
  const easeInOutPower2 = (progress) => progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const calculatePageTargets = () => {
    const maxScroll = getMaxScroll();
    const rawTargets = pages.map((page, index) => {
      if (index === 0) {
        return 0;
      }
      if (index === pages.length - 1) {
        return maxScroll;
      }
      return clampScroll(page.offsetLeft + page.offsetWidth / 2 - scroller.clientWidth / 2, maxScroll);
    });
    const minimumPageDistance = Math.max(48, scroller.clientWidth * 0.08);

    pageTargets = rawTargets.reduce((targets, target, index) => {
      const previousTarget = targets[targets.length - 1];
      const isLastTarget = index === rawTargets.length - 1;

      if (!targets.length || target - previousTarget >= minimumPageDistance) {
        targets.push(target);
      } else if (isLastTarget && targets.length === 1 && target > previousTarget) {
        targets.push(target);
      } else if (isLastTarget) {
        targets[targets.length - 1] = target;
      }

      return targets;
    }, []);
  };

  const getNearestPageIndex = () => pageTargets.reduce((nearestIndex, target, index) => (
    Math.abs(target - scroller.scrollLeft) < Math.abs(pageTargets[nearestIndex] - scroller.scrollLeft)
      ? index
      : nearestIndex
  ), 0);

  const animateContinuousScroll = () => {
    const distance = continuousTargetScroll - scroller.scrollLeft;

    if (Math.abs(distance) > 0.45) {
      scroller.scrollLeft += distance * 0.2;
      onUpdate?.();
      animationFrame = window.requestAnimationFrame(animateContinuousScroll);
      return;
    }

    scroller.scrollLeft = continuousTargetScroll;
    currentIndex = getNearestPageIndex();
    animationFrame = null;
    onUpdate?.();

  };

  const animateToPage = (direction) => {
    calculatePageTargets();
    const startScrollLeft = scroller.scrollLeft;
    const nextIndex = direction > 0 ? currentIndex + 1 : currentIndex - 1;
    const targetScrollLeft = pageTargets[nextIndex];
    const startedAt = performance.now();

    isAnimating = true;
    awaitingGestureRelease = true;
    currentIndex = nextIndex;

    const animateFrame = (timestamp) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const easedProgress = easeInOutPower2(progress);
      scroller.scrollLeft = startScrollLeft + (targetScrollLeft - startScrollLeft) * easedProgress;
      onUpdate?.();

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animateFrame);
        return;
      }

      scroller.scrollLeft = targetScrollLeft;
      animationFrame = null;
      isAnimating = false;
      onUpdate?.();
    };

    animationFrame = window.requestAnimationFrame(animateFrame);
  };

  calculatePageTargets();
  currentIndex = getNearestPageIndex();

  wheelTarget.addEventListener(
    "wheel",
    (event) => {
      const isActive = activationCheck
        ? activationCheck(activationElement)
        : isElementAtViewportCenter(activationElement);

      if (event.defaultPrevented || event.ctrlKey) {
        return;
      }

      if (isAnimating) {
        event.preventDefault();
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          lastWheelInputAt = performance.now();
        }
        return;
      }

      if (!isActive) {
        return;
      }

      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      if (!pageTargets.length || getMaxScroll() <= 0) {
        return;
      }

      const wheelInputAt = performance.now();
      const timeSinceLastWheelInput = wheelInputAt - lastWheelInputAt;
      lastWheelInputAt = wheelInputAt;
      const direction = event.deltaY > 0 ? 1 : -1;

      if (continuous) {
        const maxScroll = getMaxScroll();
        const normalizedWheelDistance = event.deltaMode === 1
          ? event.deltaY * 32
          : event.deltaMode === 2
            ? event.deltaY * scroller.clientWidth
            : event.deltaY;
        const wheelDistance = normalizedWheelDistance * (isLikelyTrackpad(event) ? 0.55 : 0.78);
        const requestedScrollLeft = continuousTargetScroll + wheelDistance;
        const nextScrollLeft = clampScroll(requestedScrollLeft, maxScroll);
        const isCrossingBoundary = requestedScrollLeft < 0 || requestedScrollLeft > maxScroll;
        const actualBoundaryTolerance = 2;
        const isActuallyAtBoundary = direction > 0
          ? scroller.scrollLeft >= maxScroll - actualBoundaryTolerance
          : scroller.scrollLeft <= actualBoundaryTolerance;
        const minimumIntentDelta = isLikelyTrackpad(event) ? 7 : 40;
        const boundaryThreshold = isLikelyTrackpad(event) ? 140 : 120;

        if (direction !== boundaryIntentDirection) {
          boundaryIntentDistance = 0;
          boundaryIntentDirection = direction;
        }

        if (
          isCrossingBoundary
          && isActuallyAtBoundary
          && Math.abs(normalizedWheelDistance) >= minimumIntentDelta
        ) {
          boundaryIntentDistance += Math.abs(wheelDistance);
        } else {
          boundaryIntentDistance = 0;
        }

        const shouldLeaveBoundary = boundaryIntentDistance >= boundaryThreshold;

        if (nextScrollLeft !== continuousTargetScroll) {
          event.preventDefault();
          stopHomeSmoothScroll();
          continuousTargetScroll = nextScrollLeft;
          if (!animationFrame) {
            animationFrame = window.requestAnimationFrame(animateContinuousScroll);
          }
        } else if (isCrossingBoundary) {
          event.preventDefault();
        }

        if (shouldLeaveBoundary) {
          boundaryIntentDistance = 0;
          if (onBoundary) {
            onBoundary(direction);
          } else {
            moveHomeToAdjacentSlide(direction);
          }
        }
        return;
      }

      if (awaitingGestureRelease) {
        if (timeSinceLastWheelInput < gestureReleaseGap) {
          event.preventDefault();
          return;
        }
        awaitingGestureRelease = false;
      }

      const atFirstPage = currentIndex === 0;
      const atLastPage = currentIndex === pageTargets.length - 1;
      const isLeavingAtBoundary = direction < 0 ? atFirstPage : atLastPage;

      if (isLeavingAtBoundary) {
        return;
      }

      event.preventDefault();
      stopHomeSmoothScroll();
      animateToPage(direction);
    },
    { passive: false }
  );

  scroller.addEventListener(
    "scroll",
    () => {
      if (!isAnimating) {
        currentIndex = getNearestPageIndex();
        if (!animationFrame) {
          continuousTargetScroll = scroller.scrollLeft;
        }
      }
      onUpdate?.();
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    isAnimating = false;
    awaitingGestureRelease = false;
    calculatePageTargets();
    currentIndex = getNearestPageIndex();
    scroller.scrollLeft = pageTargets[currentIndex];
    continuousTargetScroll = scroller.scrollLeft;
    boundaryIntentDistance = 0;
    boundaryIntentDirection = 0;
    onUpdate?.();
  });

  window.addEventListener("scroll", () => {
    const isActive = activationCheck
      ? activationCheck(activationElement)
      : isElementAtViewportCenter(activationElement);

    if (!isActive && !isAnimating) {
      awaitingGestureRelease = false;
    }
  }, { passive: true });
};

document.querySelectorAll(".animated-product-card, .product-house-hotspot").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    const href = trigger.dataset.href || trigger.getAttribute("href");

    if (!href) {
      return;
    }

    window.location.href = href;
  });
});

const productShowcaseGrid = document.querySelector(".product-showcase-grid");

if (productShowcaseGrid) {
  const productShowcaseSection = productShowcaseGrid.closest(".product-showcase-section");
  const updateProductShowcaseMotion = () => {
    const maxScroll = productShowcaseGrid.scrollWidth - productShowcaseGrid.clientWidth;
    const progress = maxScroll > 0 ? productShowcaseGrid.scrollLeft / maxScroll : 0;
    productShowcaseSection?.style.setProperty("--showcase-shift", `${-180 * progress}px`);
    productShowcaseSection?.style.setProperty("--showcase-glow", `${26 + 48 * progress}%`);
  };

  updateProductShowcaseMotion();
}

const productHouseStage = document.querySelector(".products-page .product-house-stage");

const houseFullscreenTrigger = document.querySelector(".house-fullscreen-trigger");

if (productHouseStage && houseFullscreenTrigger) {
  const sourceHotspots = Array.from(productHouseStage.querySelectorAll(".product-house-hotspot"));
  const fullscreenHouseStage = productHouseStage.cloneNode(true);
  fullscreenHouseStage.classList.add("interactive-house-fullscreen-stage");
  fullscreenHouseStage.querySelector(".house-fullscreen-trigger")?.remove();

  const legendItems = sourceHotspots.map((hotspot) => {
    const color = getComputedStyle(hotspot).getPropertyValue("--dot-color").trim() || "var(--accent)";
    const title = hotspot.dataset.title || hotspot.textContent.trim();
    return `<a href="${hotspot.getAttribute("href")}"><span style="--legend-color: ${color}"></span>${title}</a>`;
  }).join("");

  const interactiveHouseModal = document.createElement("div");
  interactiveHouseModal.className = "interactive-house-modal";
  interactiveHouseModal.setAttribute("role", "dialog");
  interactiveHouseModal.setAttribute("aria-modal", "true");
  interactiveHouseModal.setAttribute("aria-label", "Casa interattiva e legenda prodotti");
  interactiveHouseModal.innerHTML = `
    <button class="interactive-house-modal-backdrop" type="button" aria-label="Chiudi casa interattiva"></button>
    <section class="interactive-house-modal-panel">
      <button class="interactive-house-modal-close" type="button" aria-label="Chiudi">×</button>
      <div class="interactive-house-modal-view"></div>
      <aside class="interactive-house-legend">
        <p class="eyebrow">Legenda colori</p>
        <h2>Esplora la casa</h2>
        <p>Passa sui pallini o seleziona una categoria per aprire il catalogo dedicato.</p>
        <nav aria-label="Categorie della casa interattiva">${legendItems}</nav>
      </aside>
    </section>
  `;

  interactiveHouseModal.querySelector(".interactive-house-modal-view")?.append(fullscreenHouseStage);
  document.body.append(interactiveHouseModal);

  const closeInteractiveHouse = () => {
    interactiveHouseModal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    houseFullscreenTrigger.focus();
  };

  houseFullscreenTrigger.addEventListener("click", () => {
    interactiveHouseModal.classList.add("is-open");
    document.body.classList.add("modal-open");
    interactiveHouseModal.querySelector(".interactive-house-modal-close")?.focus();
  });

  interactiveHouseModal.querySelectorAll(".interactive-house-modal-backdrop, .interactive-house-modal-close").forEach((control) => {
    control.addEventListener("click", closeInteractiveHouse);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && interactiveHouseModal.classList.contains("is-open")) {
      closeInteractiveHouse();
    }
  });
}

const doorCatalogGrid = document.querySelector(".door-catalog-page .generated-catalog-grid");

if (doorCatalogGrid) {
  const doorCards = Array.from(doorCatalogGrid.querySelectorAll(".catalog-product-card"));
  const getDoorCategory = (card) => card.querySelector(".eyebrow")?.textContent.trim() || "Altri modelli";
  const doorCategories = [...new Set(doorCards.map(getDoorCategory))];
  const requestedDoorCategory = new URLSearchParams(window.location.search).get("linea")?.toUpperCase();

  if (doorCards.length && doorCategories.length) {
    const categoryPicker = document.createElement("div");
    categoryPicker.className = "door-catalog-picker";
    categoryPicker.setAttribute("aria-label", "Seleziona una collezione di porte");
    categoryPicker.innerHTML = "<p>Scegli una linea di porte per vedere una selezione di modelli.</p>";

    const moreModels = document.createElement("aside");
    moreModels.className = "door-catalog-more";
    moreModels.hidden = true;
    moreModels.innerHTML = `
      <div>
        <p class="eyebrow">In studio</p>
        <h2>Vuoi vedere tutte le varianti?</h2>
        <p>Prenota un incontro in studio: trovi finiture, misure e molti altri modelli della collezione selezionata.</p>
      </div>
      <a class="btn btn-accent" href="../../chi-siamo.html#contatti">Prenota in studio</a>
    `;

    const setActiveCategory = (category) => {
      doorCards.forEach((card) => {
        card.hidden = getDoorCategory(card) !== category;
      });

      categoryPicker.querySelectorAll("button").forEach((button) => {
        const isActive = button.dataset.category === category;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      doorCatalogGrid.hidden = false;
      doorCatalogGrid.classList.add("is-door-filtered");
      moreModels.hidden = false;
    };

    doorCategories.forEach((category) => {
      const categoryCards = doorCards.filter((card) => getDoorCategory(card) === category);
      const representativeImage = categoryCards[0]?.querySelector("img");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.category = category;
      button.innerHTML = `
        ${representativeImage ? `<img src="${representativeImage.getAttribute("src")}" alt="Porta rappresentativa della linea ${category}" loading="lazy">` : ""}
        <span>Linea</span>
        <strong>${category}</strong>
        <small>Apri ${categoryCards.length} ${categoryCards.length === 1 ? "modello" : "modelli"}</small>
      `;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        window.location.href = `${window.location.pathname}?linea=${encodeURIComponent(category)}`;
      });
      categoryPicker.append(button);
    });

    doorCatalogGrid.before(categoryPicker);
    doorCatalogGrid.after(moreModels);

    if (requestedDoorCategory && doorCategories.includes(requestedDoorCategory)) {
      doorCards
        .filter((card) => getDoorCategory(card) !== requestedDoorCategory)
        .forEach((card) => card.remove());

      const dedicatedHeader = document.createElement("div");
      dedicatedHeader.className = "door-dedicated-header";
      dedicatedHeader.innerHTML = `
        <div>
          <p class="eyebrow">Linea selezionata</p>
          <h2>Modelli ${requestedDoorCategory}</h2>
        </div>
        <a class="btn btn-dark" href="${window.location.pathname}">&larr; Torna ai modelli</a>
      `;
      const catalogSectionHead = doorCatalogGrid.closest(".generated-catalog-section")?.querySelector(".section-head");
      if (catalogSectionHead) {
        catalogSectionHead.remove();
      }

      document.body.classList.add("is-door-line-view");
      categoryPicker.hidden = true;
      doorCatalogGrid.before(dedicatedHeader);
      setActiveCategory(requestedDoorCategory);
    } else {
      doorCatalogGrid.hidden = true;
    }
  }
}

const windowCatalogGrid = /\/prodotti\/finestre\/(?:index\.html)?$/i.test(window.location.pathname)
  ? document.querySelector(".generated-catalog-grid")
  : null;

if (windowCatalogGrid) {
  document.body.classList.add("window-catalog-page");
  const windowCards = Array.from(windowCatalogGrid.querySelectorAll(".catalog-product-card"));
  const getWindowCategory = (card) => card.querySelector(".eyebrow")?.textContent.trim() || "Altri modelli";
  const windowCategories = [...new Set(windowCards.map(getWindowCategory))];
  const requestedWindowCategory = new URLSearchParams(window.location.search).get("linea")?.toUpperCase();

  if (windowCards.length && windowCategories.length) {
    const categoryPicker = document.createElement("div");
    categoryPicker.className = "door-catalog-picker window-catalog-picker";
    categoryPicker.setAttribute("aria-label", "Seleziona una categoria di finestre");
    categoryPicker.innerHTML = "<p>Scegli una categoria per vedere tutti i modelli disponibili.</p>";

    windowCategories.forEach((category) => {
      const categoryCards = windowCards.filter((card) => getWindowCategory(card) === category);
      const representativeImage = categoryCards[0]?.querySelector("img");
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `
        ${representativeImage ? `<img src="${representativeImage.getAttribute("src")}" alt="Finestra rappresentativa della categoria ${category}" loading="lazy">` : ""}
        <span>Categoria</span>
        <strong>${category}</strong>
        <small>Apri ${categoryCards.length} ${categoryCards.length === 1 ? "modello" : "modelli"}</small>
      `;
      button.addEventListener("click", () => {
        window.location.href = `${window.location.pathname}?linea=${encodeURIComponent(category)}`;
      });
      categoryPicker.append(button);
    });

    windowCatalogGrid.before(categoryPicker);

    if (requestedWindowCategory && windowCategories.includes(requestedWindowCategory)) {
      windowCards
        .filter((card) => getWindowCategory(card) !== requestedWindowCategory)
        .forEach((card) => card.remove());

      const dedicatedHeader = document.createElement("div");
      dedicatedHeader.className = "door-dedicated-header";
      dedicatedHeader.innerHTML = `
        <div>
          <p class="eyebrow">Categoria selezionata</p>
          <h2>Modelli ${requestedWindowCategory}</h2>
        </div>
        <a class="btn btn-dark" href="${window.location.pathname}">&larr; Torna ai modelli</a>
      `;
      windowCatalogGrid.closest(".generated-catalog-section")?.querySelector(".section-head")?.remove();
      categoryPicker.hidden = true;
      windowCatalogGrid.before(dedicatedHeader);
      windowCatalogGrid.classList.add("is-window-filtered");
    } else {
      windowCatalogGrid.hidden = true;
    }
  }
}

if (window.location.pathname.includes("/prodotti/finestre/") && document.querySelector(".catalog-product-hero")) {
  const technicalInfo = document.querySelector(".catalog-info-text");
  const productTitle = document.querySelector(".catalog-product-hero h1")?.textContent.trim() || "";
  document.querySelector(".catalog-product-hero .button-row .btn-dark")?.remove();

  if (technicalInfo) {
    const rawText = technicalInfo.textContent
      .replace(/Ã©/g, "é")
      .replace(/Ã¨/g, "è")
      .replace(/Ã²/g, "ò")
      .replace(/Ã /g, "à");
    const model = rawText.match(/MODELLO:\s*([^\n]+)/i)?.[1]?.trim().replaceAll("_", " ") || productTitle;
    const page = rawText.match(/PAGINA PDF:\s*(\d+)/i)?.[1] || "";
    const detailParagraph = technicalInfo.querySelectorAll("p")[1]?.textContent || "";
    const detailLines = detailParagraph
      .replace(/Ã©/g, "é")
      .replace(/Ã¨/g, "è")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^TESTO PDF:?$/i.test(line) && !/^\d+$/.test(line))
      .filter((line) => line.toLowerCase() !== productTitle.toLowerCase())
      .map((line) => line
        .replaceAll("_", " ")
        .replace(/portanteinterno/gi, "portante interno")
        .replace(/lariceerovere/gi, "larice e rovere")
        .replace(/\s*:\s*/g, ": ")
        .replace(/\s+/g, " "));

    technicalInfo.replaceChildren();
    technicalInfo.classList.add("catalog-technical-summary");

    const facts = document.createElement("dl");
    [["Modello", model], ["Pagina catalogo", page]].forEach(([label, value]) => {
      if (!value) return;
      const item = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      item.append(term, description);
      facts.append(item);
    });
    technicalInfo.append(facts);

    if (detailLines.length) {
      const detailsTitle = document.createElement("h2");
      detailsTitle.textContent = "Caratteristiche tecniche";
      const details = document.createElement("ul");
      detailLines.forEach((line) => {
        const item = document.createElement("li");
        const normalizedLine = line.charAt(0).toUpperCase() + line.slice(1);
        item.textContent = /[.!?]$/.test(normalizedLine) ? normalizedLine : `${normalizedLine}.`;
        details.append(item);
      });
      technicalInfo.append(detailsTitle, details);
    }
  }
}

const setupHomeProductFluidCanvas = (slide) => {
  if (!slide || slide.querySelector(".home-products-fluid-canvas")) {
    return { setProgress: () => {} };
  }

  const canvas = document.createElement("canvas");
  canvas.className = "home-products-fluid-canvas";
  canvas.setAttribute("aria-hidden", "true");
  slide.prepend(canvas);

  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasScale = 1;
  let paletteMix = 0;
  let targetPaletteMix = 0;
  let scrollEnergy = 0;
  let lastScrollY = window.scrollY;
  let animationFrame = null;

  const interpolate = (from, to, amount) => from.map((value, index) => value + (to[index] - value) * amount);
  const toRgba = (color, alpha) => `rgba(${color.map((value) => Math.round(value)).join(", ")}, ${alpha})`;

  const resizeCanvas = () => {
    const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    const qualityScale = window.innerWidth <= 860 ? 0.6 : 0.75;
    canvasScale = deviceScale * qualityScale;
    canvasWidth = Math.max(1, Math.floor(window.innerWidth * canvasScale));
    canvasHeight = Math.max(1, Math.floor(window.innerHeight * canvasScale));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  };

  const updateCanvasVisibility = () => {
    const rect = slide.getBoundingClientRect();
    canvas.style.opacity = rect.top < window.innerHeight && rect.bottom > 0 ? "1" : "0";
  };

  const drawContourSet = (time, color, lineCount, vertical, amplitudeMultiplier, lineWidth) => {
    const step = Math.max(14, Math.round(20 * canvasScale));
    const primaryAmplitude = canvasHeight * 0.068 * amplitudeMultiplier;
    const secondaryAmplitude = canvasHeight * 0.034 * amplitudeMultiplier;

    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    for (let index = 0; index < lineCount; index += 1) {
      const ratio = (index + 0.5) / lineCount;
      const base = vertical ? canvasWidth * ratio : canvasHeight * ratio;
      const phase = time * (0.00052 + index * 0.000008) + index * 1.73;
      const morphTime = time * 0.00042 + index * 1.19;
      const primaryMorph = 1 + Math.sin(morphTime) * 0.3;
      const secondaryMorph = 1 + Math.cos(morphTime * 1.34) * 0.36;
      const rippleMorph = 1 + Math.sin(morphTime * 1.76) * 0.28;
      context.beginPath();

      for (let position = -step * 2; position <= (vertical ? canvasHeight : canvasWidth) + step * 2; position += step) {
        const wave =
          Math.sin(position * 0.012 + phase) * primaryAmplitude * primaryMorph +
          Math.sin(position * 0.0042 - phase * 1.45) * secondaryAmplitude * secondaryMorph +
          Math.cos(position * 0.020 + phase * 0.62) * primaryAmplitude * 0.18 * rippleMorph +
          scrollEnergy * canvasHeight * 0.16;
        const coordinate = base + wave;

        if (vertical) {
          if (position === -step * 2) {
            context.moveTo(coordinate, position);
          } else {
            context.lineTo(coordinate, position);
          }
        } else if (position === -step * 2) {
          context.moveTo(position, coordinate);
        } else {
          context.lineTo(position, coordinate);
        }
      }

      context.stroke();
    }
  };

  const drawFrame = (time) => {
    if (reducedMotion) {
      animationFrame = null;
    }

    paletteMix += (targetPaletteMix - paletteMix) * 0.08;
    scrollEnergy *= 0.92;

    const background = interpolate([255, 255, 255], [4, 5, 7], paletteMix);
    const linePrimary = interpolate([24, 30, 34], [240, 245, 244], paletteMix);
    const lineSecondary = interpolate([68, 76, 80], [156, 170, 172], paletteMix);
    const accent = interpolate([96, 108, 112], [204, 220, 222], paletteMix);

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = toRgba(background, 1);
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    drawContourSet(time, toRgba(lineSecondary, 0.075 + paletteMix * 0.025), 5, false, 1.08, 2.4);
    drawContourSet(time + 2100, toRgba(linePrimary, 0.15 + paletteMix * 0.035), 2, true, 0.82, 3.8);
    drawContourSet(time + 4800, toRgba(accent, 0.04 + paletteMix * 0.025), 1, false, 1.65, 2.2);

    if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(drawFrame);
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      const scrollDelta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      scrollEnergy = Math.max(-0.35, Math.min(0.35, scrollEnergy + scrollDelta * 0.0018));
      updateCanvasVisibility();
      if (reducedMotion && !animationFrame) {
        animationFrame = window.requestAnimationFrame((time) => {
          animationFrame = null;
          drawFrame(time);
        });
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (reducedMotion && !animationFrame) {
      animationFrame = window.requestAnimationFrame((time) => {
        animationFrame = null;
        drawFrame(time);
      });
    }
  });

  resizeCanvas();
  updateCanvasVisibility();
  animationFrame = window.requestAnimationFrame(drawFrame);

  return {
    setProgress: (progress) => {
      targetPaletteMix = Math.max(0, Math.min(1, progress));
      if (reducedMotion && !animationFrame) {
        animationFrame = window.requestAnimationFrame((time) => {
          animationFrame = null;
          drawFrame(time);
        });
      }
    }
  };
};

const homeProductStrip = document.querySelector(".home-slide-products .home-product-strip");

if (homeProductStrip) {
  const homeProductSlide = homeProductStrip.closest(".home-slide-products");
  const homeProductFluidCanvas = setupHomeProductFluidCanvas(homeProductSlide);
  const desktopHomeLayout = window.matchMedia("(min-width: 861px)");

  const updateHomeProductMotion = () => {
    const maxScroll = homeProductStrip.scrollWidth - homeProductStrip.clientWidth;
    const progress = maxScroll > 0 ? homeProductStrip.scrollLeft / maxScroll : 0;
    const cardSurface = Math.round(11 + (255 - 11) * progress);
    const cardText = Math.round(255 - (255 - 17) * progress);
    const cardBorder = Math.round(12 + (255 - 12) * progress);
    homeProductSlide?.style.setProperty("--home-products-shift", `${-96 * progress}px`);
    homeProductSlide?.style.setProperty("--home-products-glow", `${24 + 52 * progress}%`);
    homeProductSlide?.style.setProperty("--home-products-progress", progress.toFixed(4));
    homeProductSlide?.style.setProperty("--home-products-card-surface", `rgb(${cardSurface}, ${cardSurface}, ${cardSurface})`);
    homeProductSlide?.style.setProperty("--home-products-card-text", `rgb(${cardText}, ${cardText}, ${cardText})`);
    homeProductSlide?.style.setProperty("--home-products-card-border", `rgb(${cardBorder}, ${cardBorder}, ${cardBorder})`);
    homeProductFluidCanvas.setProgress(progress);
  };

  if (desktopHomeLayout.matches) {
    setupSmoothHorizontalWheel({
      scroller: homeProductStrip,
      wheelTarget: window,
      activationElement: homeProductSlide,
      activationCheck: isHomeProductHorizontalReady,
      onUpdate: updateHomeProductMotion,
      onBoundary: (direction) => {
        moveHomeToAdjacentSlide(direction);
      },
      duration: 550,
      gestureReleaseGap: 360,
      continuous: true
    });
  }
  updateHomeProductMotion();
}

stopHomeSmoothScroll = setupSmoothHomeScroll() || stopHomeSmoothScroll;

sessionStorage.removeItem("arProductPageEffect");
sessionStorage.removeItem("arProductPageTitle");
sessionStorage.removeItem("arProductPageObject");

const homeSlides = document.querySelectorAll("[data-home-slide]");

if (homeSlides.length && "IntersectionObserver" in window) {
  let activeSlideIndex = 0;
  const slideObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const nextSlideIndex = Array.from(homeSlides).indexOf(entry.target);
          const direction = nextSlideIndex >= activeSlideIndex ? "down" : "up";
          activeSlideIndex = nextSlideIndex;
          homeSlides.forEach((slide) => slide.classList.remove("is-active"));
          entry.target.dataset.direction = direction;
          entry.target.classList.add("is-active");
        }
      });
    },
    { threshold: 0.55 }
  );

  homeSlides.forEach((slide) => slideObserver.observe(slide));
}

const workCarousel = document.querySelector("[data-work-carousel]");

if (workCarousel) {
  const slides = Array.from(workCarousel.querySelectorAll("[data-work-slide]"));
  const thumbs = Array.from(workCarousel.querySelectorAll("[data-work-thumb]"));
  const backdrop = workCarousel.querySelector(".home-work-backdrop img");
  let activeWorkIndex = 0;
  let workTimer;

  const setWorkSlide = (nextIndex) => {
    if (!slides.length) {
      return;
    }

    activeWorkIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => slide.classList.toggle("is-active", index === activeWorkIndex));
    thumbs.forEach((thumb, index) => thumb.classList.toggle("is-active", index === activeWorkIndex));

    const activeImage = slides[activeWorkIndex].querySelector("img");
    if (backdrop && activeImage) {
      backdrop.style.opacity = "0.18";
      backdrop.style.transform = "scale(1.12)";
      window.setTimeout(() => {
        backdrop.src = activeImage.currentSrc || activeImage.src;
        backdrop.style.opacity = "";
        backdrop.style.transform = "";
      }, 160);
    }
  };

  const startWorkCarousel = () => {
    window.clearInterval(workTimer);
    workTimer = window.setInterval(() => setWorkSlide(activeWorkIndex + 1), 4200);
  };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      setWorkSlide(index);
      startWorkCarousel();
    });
  });

  workCarousel.addEventListener("mouseenter", () => window.clearInterval(workTimer));
  workCarousel.addEventListener("mouseleave", startWorkCarousel);
  setWorkSlide(0);
  startWorkCarousel();
}

const windowConfigurator = document.querySelector("[data-window-configurator]");

if (windowConfigurator) {
  const colorButtons = Array.from(windowConfigurator.querySelectorAll("[data-config-color]"));
  const selectedColorName = windowConfigurator.querySelector("[data-selected-color-name]");

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      windowConfigurator.style.setProperty("--frame-color", button.dataset.configColor);
      windowConfigurator.style.setProperty("--frame-highlight", button.dataset.configHighlight || "rgba(255,255,255,0.5)");
      windowConfigurator.style.setProperty("--frame-shadow", button.dataset.configShadow || "rgba(17,17,17,0.2)");
      colorButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");

      if (selectedColorName) {
        selectedColorName.textContent = button.dataset.configName || button.textContent.trim();
      }
    });
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
