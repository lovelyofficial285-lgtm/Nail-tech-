/* ============================================================
   JC HAIR STUDIO — script.js
   Vanilla JS: navbar, scrollspy, reveal, lightbox, form,
   floating buttons. Loaded with `defer` (after Bootstrap).
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     1) NAVBAR — translucent -> solid on scroll
     ============================================================ */
  const navbar = document.getElementById('navbarJC');
  const backToTop = document.getElementById('backToTop');

  function onScrollUI() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);
    backToTop.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScrollUI, { passive: true });
  onScrollUI();

  /* ============================================================
     2) SMOOTH SCROLL with fixed-navbar offset + active link spy
     ============================================================ */
  const navLinks = document.querySelectorAll('#mainNav .nav-link');
  const sections = document.querySelectorAll('section[id], footer[id]');

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = navbar.offsetHeight + 14;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });

      // Collapse the mobile menu after choosing a link
      const collapseEl = document.getElementById('mainNav');
      if (collapseEl.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
      }
    });
  });

  function spyActiveLink() {
    const pos = window.scrollY + navbar.offsetHeight + 100;
    let current = 'home';
    sections.forEach(function (sec) {
      if (pos >= sec.offsetTop) current = sec.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', spyActiveLink, { passive: true });
  spyActiveLink();

  /* ============================================================
     3) SCROLL-REVEAL — IntersectionObserver
     ============================================================ */
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -36px 0px' });

  document.querySelectorAll('.reveal-item').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ============================================================
     4) GALLERY LIGHTBOX — Bootstrap modal + prev/next + keys
     ============================================================ */
  const galleryImgs = Array.from(document.querySelectorAll('.masonry-item img'));
  const lbModalEl = document.getElementById('galleryModal');
  const lbImg = document.getElementById('lightboxImg');
  const lbCounter = document.getElementById('lightboxCounter');
  let lbIndex = 0;

  // Build the modal only once (Bootstrap 5)
  const lbModal = bootstrap.Modal.getOrCreateInstance(lbModalEl);

  function showLbImage(i) {
    lbIndex = (i + galleryImgs.length) % galleryImgs.length;
    const src = galleryImgs[lbIndex].dataset.full || galleryImgs[lbIndex].src;
    lbImg.src = src;
    lbImg.alt = galleryImgs[lbIndex].alt;
    lbCounter.textContent = (lbIndex + 1) + ' / ' + galleryImgs.length;
  }

  // Open on image click via delegation
  document.querySelectorAll('.masonry-item').forEach(function (item, i) {
    item.addEventListener('click', function () {
      showLbImage(i);
      lbModal.show();
    });
  });

  document.getElementById('lbPrev').addEventListener('click', function (e) {
    e.stopPropagation();
    showLbImage(lbIndex - 1);
  });
  document.getElementById('lbNext').addEventListener('click', function (e) {
    e.stopPropagation();
    showLbImage(lbIndex + 1);
  });

  // Keyboard navigation while modal is open
  document.addEventListener('keydown', function (e) {
    if (!lbModalEl.classList.contains('show')) return;
    if (e.key === 'ArrowLeft') showLbImage(lbIndex - 1);
    if (e.key === 'ArrowRight') showLbImage(lbIndex + 1);
  });

  /* ============================================================
     5) BOOKING FORM — validation, honeypot, success state
     ============================================================ */
  const form = document.getElementById('bookingForm');
  const successBox = document.getElementById('formSuccess');

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // AU-friendly: allows +61, 04 mobile, (02) landline, spaces & dashes
  const phoneRe = /^\+?[\d\s\-()]{8,16}$/;

  function setValidity(input, isValid) {
    input.classList.toggle('is-invalid', !isValid);
    return isValid;
  }

  function validateField(field) {
    const val = field.value.trim();
    switch (field.dataset.validate) {
      case 'required': return setValidity(field, val.length > 1);
      case 'email':    return setValidity(field, emailRe.test(val));
      case 'phone':    return setValidity(field, phoneRe.test(val));
      case 'select':   return setValidity(field, val !== '');
      case 'date': {
        if (!val) return setValidity(field, false);
        const chosen = new Date(val + 'T00:00:00');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        // Studio is open Wed–Sat (3–6): give a gentle hint but don’t hard-block
        return setValidity(field, chosen >= today);
      }
      default: return true;
    }
  }

  form.querySelectorAll('[data-validate]').forEach(function (field) {
    field.addEventListener('input', function () {
      if (field.classList.contains('is-invalid')) validateField(field);
    });
    field.addEventListener('blur', function () { validateField(field); });
  });

  // Prevent past dates in the date picker
  const dateInput = document.getElementById('fldDate');
  if (dateInput) {
    const todayISO = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', todayISO);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot: silently ignore bot submissions
    const honeypot = form.querySelector('.hp-field input');
    if (honeypot && honeypot.value !== '') return;

    let allValid = true;
    form.querySelectorAll('[data-validate]').forEach(function (field) {
      if (!validateField(field)) allValid = false;
    });
    if (!allValid) return;

    /* -------------------------------------------------------
       TODO — WIRE UP FORM ENDPOINT HERE
       Replace the simulated submit below with a fetch() call:

         fetch('https://formspree.io/f/YOUR_FORM_ID', {
           method: 'POST',
           headers: { 'Accept': 'application/json' },
           body: new FormData(form)
         })

       or initialise EmailJS and call
         emailjs.sendForm('SERVICE_ID', 'TEMPLATE_ID', form)
       ------------------------------------------------------- */

    const submitBtn = form.querySelector('button[type="submit"]');
    const original = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Sending…';

    // Simulated request (remove once wired to Formspree / EmailJS)
    setTimeout(function () {
      form.reset();
      form.querySelectorAll('.is-invalid').forEach(function (el) {
        el.classList.remove('is-invalid');
      });
      submitBtn.disabled = false;
      submitBtn.innerHTML = original;
      successBox.classList.remove('d-none');
      successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      setTimeout(function () { successBox.classList.add('d-none'); }, 6000);
    }, 1200);
  });

  /* ============================================================
     6) BACK TO TOP
     ============================================================ */
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

} ) ();
s