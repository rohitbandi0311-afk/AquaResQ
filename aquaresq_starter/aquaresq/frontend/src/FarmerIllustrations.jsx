function PondIllustration({ className = "", aerationOn = false, language = "en" }) {
  const label = language === "te"
    ? `రొయ్యల చెరువు, ఏరేటర్ ${aerationOn ? "ఈ అంచనాలో నడుస్తోంది" : "ఈ అంచనాలో నడవడం లేదు"}`
    : `Illustration of a shrimp pond and aerator${aerationOn ? ", aerator running in this scenario" : ", aerator not running in this scenario"}`;
  return <svg className={`${className} ${aerationOn ? "aerator-running" : ""}`} viewBox="0 0 320 156" role="img" aria-label={label}>
    <path d="M0 119C44 105 85 115 126 108s82-7 119 2 53 4 75-5v51H0z" fill="#dbead8"/>
    <path d="M13 104c36-20 78-18 119-14 40 4 85-6 126 0 19 3 35 9 49 17-11 20-40 29-78 32H74c-31-2-53-13-61-35" fill="#72c4b1"/>
    <path d="M22 106c36-15 75-12 112-9 44 4 85-5 126 1 17 2 31 6 42 11" fill="none" stroke="#bce9dc" strokeWidth="4" strokeLinecap="round"/>
    <path d="M65 120c25-7 42-7 69-2m43 4c25-6 47-5 70 0" fill="none" stroke="#3b9c8b" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
    <path d="M223 86V43" stroke="#627e5a" strokeWidth="4" strokeLinecap="round"/>
    <g className="aerator-fan" style={{ transformOrigin: "223px 43px" }}>
      <path d="M207 43h32m-27-7 22 14m0-14-22 14" stroke="#708f66" strokeWidth="4" strokeLinecap="round"/>
    </g>
    <rect x="212" y="77" width="23" height="9" rx="4.5" fill="#eaa851"/>
    <path d="M203 93c-7 3-10 8-11 13m41-12c8 2 13 7 15 13" fill="none" stroke="#effff8" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M105 94c7-8 20-10 30-7 5 2 8 6 7 10-1 5-7 8-14 8l-10 5 2-7c-8-1-18-3-15-9z" fill="#f3a27e"/>
    <path d="M108 93c-8-5-13-8-19-7m22 13c-7 3-12 6-16 11m36-22c5-5 8-9 9-14m-5 20c7-1 13 0 18 2" fill="none" stroke="#cf795e" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="133" cy="91" r="1.7" fill="#513b37"/>
    <path d="M274 89c1-8 3-12 6-17m3 20c3-8 6-11 11-15" fill="none" stroke="#73966b" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="176" cy="83" r="4" fill="#eafff8" opacity=".9"/>
    <circle cx="185" cy="73" r="2.5" fill="#eafff8" opacity=".8"/>
  </svg>;
}

function GeneratorIllustration({ className = "", running = false, language = "en" }) {
  const label = language === "te"
    ? `బ్యాకప్ జనరేటర్ ${running ? "ఈ అంచనాలో విద్యుత్ ఇస్తోంది" : "ఈ అంచనాలో విద్యుత్ ఇవ్వడం లేదు"}`
    : `Illustration of a backup generator${running ? " supplying power in this scenario" : " not supplying power in this scenario"}`;
  return <svg className={`${className} ${running ? "generator-running" : ""}`} viewBox="0 0 240 150" role="img" aria-label={label}>
    <path d="M14 125h211" stroke="#dbe8df" strokeWidth="5" strokeLinecap="round"/>
    <path d="M28 52h113a9 9 0 0 1 9 9v54H28a9 9 0 0 1-9-9V61a9 9 0 0 1 9-9z" fill="#eaf4f0" stroke="#9bc5b3" strokeWidth="3"/>
    <path d="M33 62h74v42H33z" fill="#087f68"/>
    <path d="M42 70h56v26H42z" fill="#62bca2"/>
    <path d="M53 84h17m9-7 9 15m-4-15-10 15" stroke="#e8fff3" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="48" cy="119" r="10" fill="#60796d"/>
    <circle cx="122" cy="119" r="10" fill="#60796d"/>
    <circle cx="48" cy="119" r="4" fill="#eaf4f0"/>
    <circle cx="122" cy="119" r="4" fill="#eaf4f0"/>
    <path d="M141 75h25c10 0 13 8 13 17v11c0 8 6 12 13 12h16" fill="none" stroke="#6b9480" strokeWidth="4" strokeLinecap="round"/>
    <path d="m199 109 10 6-10 6" fill="none" stroke="#6b9480" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m172 26-11 19h12l-7 17 23-25h-13l7-11z" fill="#e5aa3c"/>
    <circle className="generator-power-ring" cx="179" cy="38" r="29" fill="none" stroke="#f1dfb3" strokeWidth="2"/>
  </svg>;
}

function PowerWarningIllustration({ className = "", language = "en" }) {
  return <svg className={className} viewBox="0 0 250 140" role="img" aria-label={language === "te" ? "చెరువు దగ్గర విద్యుత్ అంతరాయం బొమ్మ" : "Illustration of a power outage near a pond"}>
    <path d="M5 111c40-10 76 8 119-1s81-8 121 1v29H5z" fill="#dcefe8"/>
    <path d="M12 114c32-12 69-7 106-3 36 4 77-11 116 2" fill="none" stroke="#75c5b0" strokeWidth="7" strokeLinecap="round"/>
    <path d="M53 104V28m-19 20 19-20 20 20M40 43h27m-22 14h18m-15 14h12" fill="none" stroke="#718b79" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m119 37-14 24h15l-9 24 29-34h-17l10-14z" fill="#e0a239"/>
    <circle cx="132" cy="58" r="34" fill="none" stroke="#f0dfb8" strokeWidth="2"/>
    <path d="M179 83c10-8 20-8 29 0m-34 9c13-8 27-8 40 0m-46 9c16-7 35-7 52 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    <path d="M211 61v-18m-9 9 9-9 9 9" fill="none" stroke="#6f9e89" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export { GeneratorIllustration, PondIllustration, PowerWarningIllustration };
