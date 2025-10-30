// script.js
document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const typedTarget = document.querySelector('[data-typed]');
  if (typedTarget) {
    const phrases = typedTarget.getAttribute('data-phrases').split('|').map(str => str.trim());
    if (!prefersReducedMotion && phrases.length > 0) {
      let phraseIndex = 0;
      let charIndex = 0;
      let isDeleting = false;

      const type = () => {
        const currentPhrase = phrases[phraseIndex];
        if (!isDeleting) {
          typedTarget.textContent = currentPhrase.slice(0, charIndex + 1);
          charIndex += 1;
          if (charIndex === currentPhrase.length) {
            isDeleting = true;
            setTimeout(type, 1600);
            return;
          }
        } else {
          typedTarget.textContent = currentPhrase.slice(0, charIndex - 1);
          charIndex -= 1;
          if (charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
          }
        }
        const delay = isDeleting ? 55 : 95;
        setTimeout(type, delay);
      };

      type();
    } else {
      typedTarget.textContent = phrases[0] || '';
      typedTarget.setAttribute('data-static-phrases', phrases.join(', '));
    }
  }

  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -60px 0px'
    }
  );

  document.querySelectorAll('[data-reveal]').forEach(element => {
    revealObserver.observe(element);
  });

  const timelineItems = document.querySelectorAll('[data-timeline]');
  if (timelineItems.length) {
    if (prefersReducedMotion) {
      timelineItems.forEach(item => item.classList.add('is-visible'));
    } else {
      const timelineObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              timelineObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.3,
          rootMargin: '0px 0px -80px 0px'
        }
      );

      timelineItems.forEach(item => timelineObserver.observe(item));
    }
  }

  const heroSection = document.querySelector('.hero');
  if (heroSection && !prefersReducedMotion) {
    const updateParallax = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const parallaxValue = -(scrollY * 0.18);
      heroSection.style.setProperty('--hero-parallax', parallaxValue.toFixed(2));
    };
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  const navLinks = document.querySelectorAll('.site-nav__link');
  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      const targetId = link.getAttribute('href');
      if (targetId?.startsWith('#')) {
        const target = document.querySelector(targetId);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
      }
    });
  });

  const floatingIcons = document.querySelectorAll('.hero__icon');
  if (!prefersReducedMotion) {
    floatingIcons.forEach(icon => {
      const speed = parseFloat(icon.dataset.speed || '0.4');
      let angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 12;

      const animate = () => {
        angle += 0.01 * speed;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        icon.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        icon.dataset.rafId = requestAnimationFrame(animate).toString();
      };

      animate();
    });
  }

  const sliders = document.querySelectorAll('[data-slider]');
  sliders.forEach(slider => {
    const track = slider.querySelector('[data-slider-track]');
    const wrapper = slider.querySelector('[data-slider-wrapper]');
    const prevButton = slider.querySelector('[data-slider-prev]');
    const nextButton = slider.querySelector('[data-slider-next]');

    if (!track || !wrapper || !prevButton || !nextButton) return;

    const slides = Array.from(track.children).filter(child => child.matches('.portfolio-card'));
    if (!slides.length) return;

    let currentIndex = 0;
    let currentOffset = 0;

    const getMaxOffset = () => Math.max(0, track.scrollWidth - wrapper.clientWidth);

    const updateControls = () => {
      const maxOffset = getMaxOffset();
      prevButton.disabled = currentOffset <= 0;
      nextButton.disabled = currentOffset >= maxOffset - 1;
    };

    const applyOffset = (offset, animate = true) => {
      const maxOffset = getMaxOffset();
      const normalizedOffset = Math.min(Math.max(offset, 0), maxOffset);
      if (!animate || prefersReducedMotion) {
        track.classList.add('is-no-transition');
      } else {
        track.classList.remove('is-no-transition');
      }
      track.style.transform = `translateX(${-normalizedOffset}px)`;
      currentOffset = normalizedOffset;
      updateControls();
    };

    const scrollToIndex = (index, { animate = true } = {}) => {
      if (!slides.length) return;
      const clampedIndex = Math.max(0, Math.min(index, slides.length - 1));
      const target = slides[clampedIndex];
      const desiredOffset = target ? target.offsetLeft : 0;
      currentIndex = clampedIndex;
      applyOffset(desiredOffset, animate);
    };

    const handlePrev = () => {
      if (currentIndex === 0 && currentOffset > 0) {
        applyOffset(0);
        currentIndex = 0;
        return;
      }
      scrollToIndex(currentIndex - 1);
    };

    const handleNext = () => {
      scrollToIndex(currentIndex + 1);
    };

    prevButton.addEventListener('click', handlePrev);
    nextButton.addEventListener('click', handleNext);

    wrapper.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      }
    });

    let resizeTimeout = null;
    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        const maxOffset = getMaxOffset();
        const normalizedOffset = Math.min(currentOffset, maxOffset);

        let closestIndex = 0;
        let smallestDelta = Number.POSITIVE_INFINITY;
        slides.forEach((slide, idx) => {
          const delta = Math.abs(slide.offsetLeft - normalizedOffset);
          if (delta < smallestDelta) {
            smallestDelta = delta;
            closestIndex = idx;
          }
        });

        currentIndex = closestIndex;
        applyOffset(normalizedOffset, false);
      }, 120);
    };

    window.addEventListener('resize', handleResize);

    if (prefersReducedMotion) {
      track.classList.add('is-no-transition');
    }

    requestAnimationFrame(() => {
      scrollToIndex(0, { animate: false });
    });
  });

  const projectCards = document.querySelectorAll('.portfolio-card');
  projectCards.forEach(card => {
    const previewVideo = card.querySelector('.portfolio-card__video');
    if (!previewVideo) return;

    const dataSrc = previewVideo.dataset.src;
    let hasLoadedSrc = false;

    const ensureSrc = () => {
      if (hasLoadedSrc || !dataSrc) return;
      const normalizedSrc = encodeURI(dataSrc).replace(/#/g, '%23');
      previewVideo.src = normalizedSrc;
      hasLoadedSrc = true;
    };

    const attemptPlay = () => {
      if (prefersReducedMotion) return;
      ensureSrc();
      const playIfReady = () => {
        const playPromise = previewVideo.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(() => {});
        }
      };

      if (previewVideo.readyState >= 2) {
        playIfReady();
      } else {
        const handleCanPlay = () => {
          playIfReady();
          previewVideo.removeEventListener('canplay', handleCanPlay);
        };
        previewVideo.addEventListener('canplay', handleCanPlay);
        previewVideo.load();
      }
    };

    const pausePreview = () => {
      if (!hasLoadedSrc) return;
      previewVideo.pause();
      previewVideo.currentTime = 0;
    };

    card.addEventListener('mouseenter', attemptPlay);
    card.addEventListener('focusin', attemptPlay);
    card.addEventListener('mouseleave', pausePreview);
    card.addEventListener('focusout', event => {
      if (!card.contains(event.relatedTarget)) {
        pausePreview();
      }
    });

    if (prefersReducedMotion) {
      previewVideo.removeAttribute('loop');
    }
  });

  const previewDialog = document.querySelector('#portfolio-preview');
  if (previewDialog) {
    const previewTitle = previewDialog.querySelector('.preview-modal__title');
    const previewDescription = previewDialog.querySelector('[data-preview-description]');
    const previewPlayer = previewDialog.querySelector('[data-preview-player]');
    const previewPlaceholder = previewDialog.querySelector('[data-preview-placeholder]');
    const closeButton = previewDialog.querySelector('[data-close-preview]');
    let activePreviewVideo = null;

    const resetPreview = () => {
      if (activePreviewVideo) {
        activePreviewVideo.pause();
        activePreviewVideo.removeAttribute('src');
        while (activePreviewVideo.firstChild) {
          activePreviewVideo.removeChild(activePreviewVideo.firstChild);
        }
        activePreviewVideo.load();
        activePreviewVideo.remove();
        activePreviewVideo = null;
      }
      if (previewPlaceholder) previewPlaceholder.hidden = false;
      if (previewDescription) {
        previewDescription.textContent = 'Looping teaser will appear after you open a project preview.';
      }
    };

    document.querySelectorAll('.portfolio-card__play').forEach(button => {
      button.addEventListener('click', () => {
        const projectName = button.dataset.projectName || 'Project Preview';
        const videoSrc = button.dataset.videoSrc;
        const videoPoster = button.dataset.videoPoster;

        previewTitle.textContent = projectName;

        if (previewPlayer) {
          if (activePreviewVideo) {
            activePreviewVideo.pause();
            activePreviewVideo.removeAttribute('src');
            while (activePreviewVideo.firstChild) {
              activePreviewVideo.removeChild(activePreviewVideo.firstChild);
            }
            activePreviewVideo.load();
            activePreviewVideo.remove();
            activePreviewVideo = null;
          }

          if (previewPlaceholder) previewPlaceholder.hidden = true;

          if (videoSrc) {
            const videoEl = document.createElement('video');
            videoEl.className = 'preview-modal__video';
            videoEl.controls = true;
            videoEl.loop = true;
            videoEl.playsInline = true;
            videoEl.preload = 'auto';
            if (videoPoster) {
              videoEl.poster = videoPoster;
            }

            const normalizedSrc = encodeURI(videoSrc).replace(/#/g, '%23');
            const sourceEl = document.createElement('source');
            sourceEl.src = normalizedSrc;
            sourceEl.type = 'video/mp4';
            videoEl.appendChild(sourceEl);
            previewPlayer.appendChild(videoEl);

            const autoPlay = () => {
              if (prefersReducedMotion) return;
              const playPromise = videoEl.play();
              if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(() => {});
              }
            };

            if (videoEl.readyState >= 2) {
              autoPlay();
            } else {
              videoEl.addEventListener('canplay', autoPlay, { once: true });
            }

            activePreviewVideo = videoEl;
          }
        }

        if (previewDescription) {
          previewDescription.textContent = `Previewing ${projectName}. Use the playback controls to play or pause.`;
        }
        if (typeof previewDialog.showModal === 'function') {
          previewDialog.showModal();
        } else {
          previewDialog.setAttribute('open', '');
        }
        closeButton.focus();
      });
    });

    const closeModal = () => {
      if (typeof previewDialog.close === 'function') {
        previewDialog.close();
      } else {
        previewDialog.removeAttribute('open');
        resetPreview();
      }
    };

    closeButton.addEventListener('click', closeModal);
    previewDialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeModal();
    });
    previewDialog.addEventListener('close', resetPreview);
  }

  const avatarTrigger = document.querySelector('[data-avatar-open]');
  const avatarModal = document.querySelector('#avatar-modal');
  const avatarClose = document.querySelector('[data-avatar-close]');

  if (avatarTrigger && avatarModal) {
    const openAvatarModal = () => {
      if (typeof avatarModal.showModal === 'function') {
        avatarModal.showModal();
      } else {
        avatarModal.setAttribute('open', '');
      }
    };

    const closeAvatarModal = () => {
      if (typeof avatarModal.close === 'function') {
        avatarModal.close();
      } else {
        avatarModal.removeAttribute('open');
      }
    };

    avatarTrigger.addEventListener('click', openAvatarModal);

    if (avatarClose) {
      avatarClose.addEventListener('click', closeAvatarModal);
    }

    avatarModal.addEventListener('cancel', event => {
      event.preventDefault();
      closeAvatarModal();
    });
  }

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const fields = contactForm.querySelectorAll('input, textarea');
    const successBanner = contactForm.querySelector('.contact__success');
    const submitButton = contactForm.querySelector('.contact__submit');

    const validators = {
      name: value => value.trim().length > 0 || 'Please enter your name.',
      email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Please enter a valid email address.',
      message: value => value.trim().length >= 10 || 'Message must be at least 10 characters.'
    };

    const setFieldValidity = (field, message) => {
      const errorEl = contactForm.querySelector(`#${field.id}-error`);
      if (message === true) {
        field.setAttribute('aria-invalid', 'false');
        if (errorEl) errorEl.textContent = '';
      } else {
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = message;
      }
    };

    const validateField = field => {
      const validator = validators[field.name];
      if (!validator) return true;
      const result = validator(field.value);
      setFieldValidity(field, result);
      return result === true;
    };

    fields.forEach(field => {
      field.addEventListener('input', () => validateField(field));
      field.addEventListener('blur', () => validateField(field));
    });

    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      let formIsValid = true;

      fields.forEach(field => {
        const fieldValid = validateField(field);
        if (!fieldValid) {
          formIsValid = false;
        }
      });

      if (!formIsValid) {
        const firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
        firstInvalid?.focus();
        return;
      }

      submitButton.disabled = true;
      successBanner?.classList.remove('is-visible');

      setTimeout(() => {
        submitButton.disabled = false;
        contactForm.reset();
        if (successBanner) {
          successBanner.classList.add('is-visible');
        }
      }, 900);
    });
  }

  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      document.getElementById('home')?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });

    const toggleBackToTop = () => {
      if ((window.scrollY || window.pageYOffset) > 320) {
        backToTop.classList.add('is-visible');
      } else {
        backToTop.classList.remove('is-visible');
      }
    };

    toggleBackToTop();
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
  }

  const statsContainer = document.querySelector('#instagram-stats');
  if (statsContainer) {
    const renderStats = insights => {
      statsContainer.innerHTML = insights
        .slice(0, 3)
        .map(({ item, insights: metrics }) => {
          if (!metrics) return '';
          const { impressions = 0, reach = 0, saved = 0 } = metrics;
          return `
            <article class="stat-card">
              <a href="${item.permalink}" target="_blank" rel="noopener" class="stat-card__thumb">
                <img src="${item.thumbnail_url ?? item.media_url}" alt="${item.caption?.slice(0, 60) ?? 'Instagram post preview'}" loading="lazy">
              </a>
              <dl>
                <div><dt>Impressions</dt><dd>${impressions.toLocaleString()}</dd></div>
                <div><dt>Reach</dt><dd>${reach.toLocaleString()}</dd></div>
                <div><dt>Saves</dt><dd>${saved.toLocaleString()}</dd></div>
              </dl>
            </article>
          `;
        })
        .join('');
    };

    const loadInstagramStats = async () => {
      try {
        const res = await fetch('https://your-domain.com/api/instagram/insights');
        if (!res.ok) throw new Error('Network error');
        const { insights } = await res.json();
        if (Array.isArray(insights) && insights.length > 0) {
          renderStats(insights);
        } else {
          statsContainer.textContent = 'No insights available right now.';
        }
      } catch (error) {
        console.error('Unable to load Instagram stats', error);
        statsContainer.textContent = 'Unable to load Instagram stats. Try again later.';
      }
    };

    loadInstagramStats();
  }
});