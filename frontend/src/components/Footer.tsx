type FooterProps = {
  openSupport: () => void
  openBuy: () => void
  showNotice: (message: string) => void
}

const socialLinks = [
  ['IG', 'https://www.instagram.com/'],
  ['TG', 'https://t.me/'],
  ['TT', 'https://www.tiktok.com/'],
  ['X', 'https://x.com/'],
]

function Footer({ openSupport, openBuy, showNotice }: FooterProps) {
  return (
    <footer className="site-footer drive-footer">
      <div>
        <h4>Follow us:</h4>
        <div className="social-icons">
          {socialLinks.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Open ${label}`}>
              {label}
            </a>
          ))}
        </div>
      </div>
      <div>
        <h4>Customer Support</h4>
        <button type="button" onClick={openSupport}>Help Center</button>
        <button type="button" onClick={openBuy}>Buying Guide</button>
        <button type="button" onClick={openSupport}>Selling Guide</button>
        <button type="button" onClick={openSupport}>Report an Issue</button>
      </div>
      <div>
        <h4>Legal</h4>
        <button type="button" onClick={() => showNotice('Privacy policy opened')}>Privacy Policy</button>
        <button type="button" onClick={() => showNotice('Terms of service opened')}>Terms of Service</button>
        <button type="button" onClick={() => showNotice('Cookie policy opened')}>Cookie Policy</button>
        <button type="button" onClick={() => showNotice('Refund policy opened')}>Refund Policy</button>
      </div>
      <div>
        <h4>Contact us</h4>
        <p>Kyiv, Ukraine</p>
        <p>+380 (67) 456-78-90</p>
        <p>support@drivehub.ua</p>
        <p>Mon-Fri 9:00-18:00</p>
      </div>
      <p className="newsletter-copy">Newsletter: Stay updated with the latest vehicles and exclusive offers.</p>
      <p className="copyright-copy">2026 DriveHub. All Rights Reserved.</p>
    </footer>
  )
}

export default Footer
