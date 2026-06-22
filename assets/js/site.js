/** Site-wide behaviour: image protection and obfuscated email. */
;(function initSite() {
  function blockImageSave(event) {
    event.preventDefault()
  }

  document.addEventListener('contextmenu', (event) => {
    if (event.target.closest('.protected-image')) blockImageSave(event)
  })

  document.addEventListener('dragstart', (event) => {
    if (event.target.closest('.protected-image')) blockImageSave(event)
  })

  document.querySelectorAll('.protected-image img').forEach((img) => {
    img.setAttribute('draggable', 'false')
  })

  function decodeEmail(encoded) {
    const key = Number.parseInt(encoded.slice(0, 2), 16)
    let email = ''
    for (let index = 2; index < encoded.length; index += 2) {
      const byte = Number.parseInt(encoded.slice(index, index + 2), 16)
      email += String.fromCharCode(byte ^ key)
    }
    return email
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-email-encoded]')
    if (!link) return

    const encoded = link.getAttribute('data-email-encoded')
    if (!encoded) return

    event.preventDefault()
    window.location.href = `mailto:${decodeEmail(encoded)}`
  })

  document.querySelectorAll('[data-email-encoded]').forEach((link) => {
    const encoded = link.getAttribute('data-email-encoded')
    if (encoded) link.setAttribute('href', `/cdn-cgi/l/email-protection#${encoded}`)
  })
})()
