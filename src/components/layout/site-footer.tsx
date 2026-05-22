export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <strong>Yomu</strong>
          <span>— Gamified Learning Platform</span>
        </div>
        <div className="site-footer-copy">
          &copy; {new Date().getFullYear()} Yomu. Built for better information literacy.
        </div>
      </div>
    </footer>
  );
}
