function formatKoreanDate(dateString) {
  const date = new Date(dateString);

  const kr = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const month = kr.getMonth() + 1;
  const day = kr.getDate();
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const weekday = weekdayNames[kr.getDay()];

  const hours = kr.getHours().toString().padStart(2, "0");
  const minutes = kr.getMinutes().toString().padStart(2, "0");

  return `${month}월 ${day}일 ${weekday} ${hours}시 ${minutes}분`;
}


function buildDiscordMessage(data) {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  const emails = Array.isArray(data.emails) ? data.emails : [];

  const filtered = emails.filter(email => {
    const emailTime = new Date(email.date).getTime();
    const diff = now - emailTime;

    const within10min = diff >= 0 && diff <= tenMinutes;

    return within10min;
  });

  if (filtered.length === 0) return null;

  const message = `
## 📨 10분 내 미확인 메일 알림 (${filtered.length}건)

${filtered
    .map((email, i) => {
      const subject = email.subject || "(제목 없음)";
      const from = email.from || "";
      const snippet = (email.contentSnippet || "").trim();
      const formattedDate = formatKoreanDate(email.date);

      return `
### :label: ${i + 1}번째 미확인 메일
**제목** ${subject}
${from ? `**보낸이**: ${from}` : ""}
**시간** ${formattedDate}
**미리보기** ${snippet ? `${snippet.slice(0, 100)}...` : ""}
`;
    })
    .join("\n--------------\n")}
`.trim();

  return message;
}

(async () => {
  const sourceUrl = process.env.SOURCE_URL;
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!sourceUrl || !discordWebhookUrl) {
    console.error("SOURCE_URL 또는 DISCORD_WEBHOOK_URL 환경변수가 없습니다.");
    process.exit(1);
  }

  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      console.error("SOURCE_URL 호출 실패:", res.status, await res.text());
      process.exit(1);
    }

    const data = await res.json();
    const message = buildDiscordMessage(data);

    if (!message) {
      console.log("보낼 메일 없음 (조건에 맞는 이메일 없음)");
      return;
    }

    const discordRes = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    if (!discordRes.ok) {
      console.error("디스코드 전송 실패:", discordRes.status, await discordRes.text());
      process.exit(1);
    }

    console.log("디스코드 전송 완료");
  } catch (err) {
    console.error("스크립트 에러:", err);
    process.exit(1);
  }
})();
