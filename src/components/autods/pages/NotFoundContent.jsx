import { Link } from "react-router-dom";

function NotFoundContent() {
  return (
    <section className="marketplace-not-found card-wrapper">
      <h2 className="marketplace-not-found__code">404</h2>
      <h3 className="marketplace-not-found__title">Page not found</h3>
      <p className="marketplace-not-found__copy">
        The page you were looking for does not exist or may have been moved.
      </p>
      <Link to="/" className="button-base button-primary marketplace-not-found__link">
        Back to Dashboard
      </Link>
    </section>
  );
}

export default NotFoundContent;
