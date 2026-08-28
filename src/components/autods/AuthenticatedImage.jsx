import { useEffect, useState } from "react";
import { LuImage, LuLoader } from "react-icons/lu";

/**
 * Renders an image served by an authenticated (Bearer-token) endpoint — a plain
 * <img src="..."> can't send the Authorization header, so this fetches the blob
 * via axios and swaps it in as an object URL.
 */
function AuthenticatedImage({ fetcher, alt = "", className }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setSrc(null);
    setError(false);

    fetcher()
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className={`authenticated-image__placeholder ${className ?? ""}`}>
        <LuImage />
        <span>Could not load image</span>
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`authenticated-image__placeholder ${className ?? ""}`}>
        <LuLoader className="spin-icon" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}

export default AuthenticatedImage;
