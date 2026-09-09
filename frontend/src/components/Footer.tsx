type FooterProps = {
  showNotice: (message: string) => void
  openSupport: () => void
  openBuy: () => void
  openError: () => void
}

function Footer({ showNotice, openSupport, openBuy, openError }: FooterProps) {
  return (
    <footer className="site-footer drive-footer">
      <div>
        <h4>Follow us:</h4>
        <div className="social-icons">
          <button type="button" onClick={() => showNotice('Instagram will be added later')}>IG</button>
          <button type="button" onClick={() => showNotice('Telegram will be added later')}>TG</button>
          <button type="button" onClick={() => showNotice('TikTok will be added later')}>TT</button>
          <button type="button" onClick={() => showNotice('X profile will be added later')}>X</button>
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
