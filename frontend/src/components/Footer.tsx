type FooterProps = {
  openSupport: () => void
  openBuy: () => void
  openError: () => void
}

const socialLinks = [
  ['IG', 'https://www.instagram.com/'],
  ['TG', 'https://t.me/'],
  ['TT', 'https://www.tiktok.com/'],
  ['X', 'https://x.com/'],
]

function Footer({ openSupport, openBuy, openError }: FooterProps) {
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
        <button type="button" onClick={openError}>Privacy Policy</button>
        <button type="button" onClick={openError}>Terms of Service</button>
        <button type="button" onClick={openError}>Cookie Policy</button>
        <button type="button" onClick={openError}>Refund Policy</button>
      </div>
      <div>
        <h4>Contact us</h4>
        <p>1 Mar Street, New York</p>
        <p>+1 (515) 144-4564</p>
        <p>support@drivehub.com</p>
        <p>Mon-Fri 9:00 AM-6:00 PM</p>
      </div>
      <p className="newsletter-copy">Newsletter: Stay updated with the latest vehicles and exclusive offers.</p>
      <p className="copyright-copy">2026 DriveHub. All Rights Reserved.</p>
    </footer>
  )
}

export default Footer
