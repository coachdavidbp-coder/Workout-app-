// The "US vs Them" wordmark (transparent PNG derived from the brand logo).
import logoUrl from "../assets/logo.png";

export default function BrandLogo({ height = 22, className = "", style = {} }) {
  return (
    <img
      src={logoUrl}
      alt="Us vs Them"
      className={className}
      style={{ height, width: "auto", display: "block", ...style }}
    />
  );
}
