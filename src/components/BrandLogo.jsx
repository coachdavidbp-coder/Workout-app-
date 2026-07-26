// The "US vs Them" wordmark (transparent PNG derived from the brand logo).
export default function BrandLogo({ height = 22, className = "", style = {} }) {
  return (
    <img
      src="/brand/logo.png"
      alt="Us vs Them"
      className={className}
      style={{ height, width: "auto", display: "block", ...style }}
    />
  );
}
