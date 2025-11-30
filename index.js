function formatKoreanDate(dateString) {
  const date = new Date(dateString);

  const kr = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const month = kr.getMonth() + 1;
  const day = kr.getDate();
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const weekday = weekdayNames[kr.getDay()];

  const hours = kr.getHours().toString().padStart(2, "0");
  const minutes = kr.getMinutes().toString().padStart(2, "0");

  return `${month}월 ${day}일 ${weekday} ${hours}:${minutes}`;
}


function buildDiscordMessage(data) {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  const keywordRegex = /(결제|협찬|문의)/;

  const emails = Array.isArray(data.emails) ? data.emails : [];

  const filtered = emails.filter(email => {
    const emailTime = new Date(email.date).getTime();
    const diff = now - emailTime;

    const within10min = diff >= 0 && diff <= tenMinutes;

    const subject = email.subject || "";
    const snippet = email.contentSnippet || "";
    const hasKeyword = keywordRegex.test(subject) || keywordRegex.test(snippet);

    return within10min && hasKeyword;
  });

  if (filtered.length === 0) return null;

  const message = `
### 📨 10분 내 미확인 메일 알림 (${filtered.length}건)

${filtered
    .map((email, i) => {
      const subject = email.subject || "(제목 없음)";
      const from = email.from || "";
      const snippet = (email.contentSnippet || "").trim();
      const formattedDate = formatKoreanDate(email.date);

      return `
[${i + 1}] **${subject}**
${from ? `보낸이: ${from}` : ""}
날짜: ${formattedDate}
내용 미리보기: ${snippet ? `\`\`\`\n${snippet}\n\`\`\`` : ""}
`;
    })
    .join("\n--------------\n")}
`.trim();

  return message;
}
