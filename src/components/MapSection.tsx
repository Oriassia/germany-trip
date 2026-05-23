export function MapSection() {
  return (
    <div className="map-section" style={{ display: 'none' }}>
      <svg
        viewBox="0 0 480 360"
        width="420"
        height="360"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="מסלול הטיול"
      >
        <title>מסלול הטיול</title>
        <path
          d="M90,25 L145,15 L200,22 L255,14 L315,26 L365,52 L395,88 L390,130 L375,172 L380,210 L360,252 L340,295 L308,335 L265,355 L220,360 L178,350 L135,328 L95,298 L68,258 L52,210 L58,162 L70,108 Z"
          fill="#e8e5dc"
          stroke="#c8c5bc"
          strokeWidth="1.5"
        />
        <polyline
          points="162,142 212,200 295,192 268,245 275,305"
          fill="none"
          stroke="#7F77DD"
          strokeWidth="3.5"
          strokeDasharray="8,5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="162" cy="142" r="11" fill="#26215C" stroke="white" strokeWidth="2.5" />
        <text x="178" y="138" fontSize="12" fontWeight="600" fill="#1a1a30">
          פרנקפורט
        </text>
        <text x="178" y="151" fontSize="10" fill="#888780">
          14.6 | יום א׳
        </text>
        <circle cx="212" cy="200" r="11" fill="#3C3489" stroke="white" strokeWidth="2.5" />
        <text x="228" y="196" fontSize="12" fontWeight="600" fill="#1a1a30">
          רוטנבורג
        </text>
        <text x="228" y="209" fontSize="10" fill="#888780">
          לילה 1
        </text>
        <circle cx="295" cy="192" r="11" fill="#0F6E56" stroke="white" strokeWidth="2.5" />
        <text x="310" y="188" fontSize="12" fontWeight="600" fill="#1a1a30">
          רגנסבורג
        </text>
        <text x="310" y="201" fontSize="10" fill="#888780">
          לילה 2
        </text>
        <circle cx="268" cy="245" r="6.5" fill="#BA7517" stroke="white" strokeWidth="1.5" />
        <text x="188" y="250" fontSize="9.5" fill="#5F5E5A">
          אינגולשטדט
        </text>
        <circle cx="275" cy="305" r="13" fill="#A32D2D" stroke="white" strokeWidth="2.5" />
        <text x="293" y="301" fontSize="13" fontWeight="600" fill="#1a1a30">
          מינכן
        </text>
        <text x="293" y="315" fontSize="10" fill="#888780">
          לילה 3 + טיסה
        </text>
        <text x="55" y="45" fontSize="11" fontWeight="600" fill="#888780">
          ↑ N
        </text>
      </svg>
    </div>
  );
}
