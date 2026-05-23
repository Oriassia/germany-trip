const TIPS = [
  {
    icon: '🛣️',
    text: 'אוטובאן: שימו לב לשלטים. קטעים רבים מוגבלים ל-120–130 קמ"ש. מצלמות אוטומטיות נפוצות.',
  },
  {
    icon: '🅿️',
    text: 'חניה: רוטנבורג – Parkhaus Kobolzeller Steige. רגנסבורג – Parkhaus Dachauplatz. מינכן – חנייה מרכזית ברשמה מראש.',
  },
  {
    icon: '⛽',
    text: 'דלק: תחנות על האוטובאן יקרות ב-15–20%. עדיף לתדלק בתוך הערים.',
  },
  {
    icon: '🌡️',
    text: 'מזג אוויר יוני: 22–25°C ביום. ייתכנו גשמים קצרים. שכבה לערב בגינות הבירה.',
  },
  {
    icon: '💶',
    text: 'מטבע: אירו. קחו קצת מזומן לשווקים ומסעדות קטנות.',
  },
  {
    icon: '📱',
    text: 'ניווט: הורידו Google Maps offline לפני היציאה. כיסוי מצוין על A8 ו-A9.',
  },
];

export function TipsSection() {
  return (
    <div className="tip-card">
      <h3>⚙️ טיפים טכניים לנסיעה</h3>
      {TIPS.map((tip, i) => (
        <div className="tip-row" key={i}>
          <div className="tip-icon">{tip.icon}</div>
          <div className="tip-text">{tip.text}</div>
        </div>
      ))}
    </div>
  );
}
