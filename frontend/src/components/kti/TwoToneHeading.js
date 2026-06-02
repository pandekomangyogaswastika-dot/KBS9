// Two-tone headline: strong (bright) keywords + dim (muted) supporting words.
export const TwoToneHeading = ({
  as: As = "h2",
  strong = "",
  dim = "",
  className = "",
  dimFirst = false,
  ...rest
}) => {
  const strongSpan = strong ? <span className="kti-strong">{strong}</span> : null;
  const dimSpan = dim ? <span className="kti-dim">{dim}</span> : null;
  return (
    <As className={`font-display tracking-[-0.03em] leading-[1.08] ${className}`} {...rest}>
      {dimFirst ? (
        <>
          {dimSpan}
          {dim && strong ? " " : ""}
          {strongSpan}
        </>
      ) : (
        <>
          {strongSpan}
          {strong && dim ? " " : ""}
          {dimSpan}
        </>
      )}
    </As>
  );
};
