/** Photo gallery lightbox — loaded on the photos page only. */
;(function initLightbox() {
  const lightbox = document.getElementById('photo-lightbox')
  const dataEl = document.getElementById('gallery-data')
  if (!lightbox || !dataEl) return

  let images = []
  try {
    images = JSON.parse(dataEl.textContent)
  } catch {
    return
  }

  if (images.length === 0) return

  const closeBtn = lightbox.querySelector('.lightbox__close')
  const prevBtn = lightbox.querySelector('.lightbox__nav--prev')
  const nextBtn = lightbox.querySelector('.lightbox__nav--next')
  const mainImage = lightbox.querySelector('.lightbox__image-wrap img')
  const titleEl = lightbox.querySelector('.lightbox__title')
  const descriptionEl = lightbox.querySelector('.lightbox__description')
  const filmstrip = lightbox.querySelector('.lightbox__filmstrip')
  const siteHeader = document.querySelector('.site-header')
  let activeIndex = 0
  let filmstripBuilt = false
  const preloaded = new Set()

  function safeHttpUrl(raw) {
    if (typeof raw !== 'string' || raw.length === 0) return ''
    try {
      const url = new URL(raw, document.baseURI)
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
    } catch {
      // Ignore malformed URLs.
    }
    return ''
  }

  function preloadFull(index) {
    const normalized = (index + images.length) % images.length
    const src = images[normalized]?.fullSrc
    if (!src || preloaded.has(src)) return
    preloaded.add(src)
    const safeSrc = safeHttpUrl(src)
    if (!safeSrc) return
    const img = new Image()
    img.src = safeSrc
  }

  function preloadAdjacent() {
    preloadFull(activeIndex)
    preloadFull(activeIndex + 1)
    preloadFull(activeIndex - 1)
  }

  function createFilmstripButton(image, index) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'lightbox__filmstrip-btn'
    button.dataset.index = String(index)
    button.setAttribute('aria-label', `View ${image.title}`)

    const protect = document.createElement('span')
    protect.className = 'protected-image lightbox__filmstrip-protect'

    const img = document.createElement('img')
    const thumbSrc = safeHttpUrl(image.thumbSrc)
    if (!thumbSrc) return button
    img.src = thumbSrc
    img.alt = ''
    img.loading = 'lazy'
    img.decoding = 'async'
    img.draggable = false

    const shield = document.createElement('span')
    shield.className = 'protected-image__shield protected-image__shield--passthrough'
    shield.setAttribute('aria-hidden', 'true')

    protect.append(img, shield)
    button.append(protect)
    button.addEventListener('click', () => setActiveIndex(index))
    return button
  }

  function buildFilmstripOnce() {
    if (filmstripBuilt || !filmstrip) return
    filmstrip.replaceChildren(
      ...images.map((image, index) => createFilmstripButton(image, index)),
    )
    filmstripBuilt = true
  }

  function updateFilmstripActive() {
    if (!filmstripBuilt || !filmstrip) return

    filmstrip.querySelectorAll('.lightbox__filmstrip-btn').forEach((button, index) => {
      const isActive = index === activeIndex
      button.classList.toggle('lightbox__filmstrip-btn--active', isActive)
      if (isActive) {
        button.setAttribute('aria-current', 'true')
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      } else {
        button.removeAttribute('aria-current')
      }
    })
  }

  function setActiveIndex(index) {
    activeIndex = (index + images.length) % images.length
    const image = images[activeIndex]

    if (mainImage) {
      mainImage.decoding = 'async'
      const fullSrc = safeHttpUrl(image.fullSrc)
      if (fullSrc) mainImage.src = fullSrc
      mainImage.alt = image.alt
    }
    if (titleEl) titleEl.textContent = image.title
    if (descriptionEl) descriptionEl.textContent = image.description
    lightbox.setAttribute('aria-label', `Photo viewer: ${image.title}`)
    updateFilmstripActive()
    preloadAdjacent()
  }

  function syncLightboxOffset() {
    if (!siteHeader) return
    document.documentElement.style.setProperty(
      '--site-header-height',
      `${siteHeader.offsetHeight}px`,
    )
  }

  function open(index) {
    syncLightboxOffset()
    buildFilmstripOnce()
    setActiveIndex(index)
    lightbox.hidden = false
    document.body.style.overflow = 'hidden'
    lightbox.focus({ preventScroll: true })
  }

  function close() {
    lightbox.hidden = true
    document.body.style.overflow = ''
  }

  closeBtn?.addEventListener('click', close)
  prevBtn?.addEventListener('click', () => setActiveIndex(activeIndex - 1))
  nextBtn?.addEventListener('click', () => setActiveIndex(activeIndex + 1))

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close()
  })

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return
    if (event.key === 'Escape') close()
    if (event.key === 'ArrowLeft') setActiveIndex(activeIndex - 1)
    if (event.key === 'ArrowRight') setActiveIndex(activeIndex + 1)
  })

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lightbox-index]')
    if (!trigger) return
    const index = Number.parseInt(trigger.getAttribute('data-lightbox-index'), 10)
    if (!Number.isNaN(index)) open(index)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const trigger = event.target.closest('[data-lightbox-index]')
    if (!trigger) return
    event.preventDefault()
    const index = Number.parseInt(trigger.getAttribute('data-lightbox-index'), 10)
    if (!Number.isNaN(index)) open(index)
  })

  window.addEventListener('resize', () => {
    if (!lightbox.hidden) syncLightboxOffset()
  })
})()
