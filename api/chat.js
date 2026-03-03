export default async function handler(req, res) {
  // ブラウザからのアクセスを許可
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 事前確認リクエスト対応
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POST以外は拒否
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "POST送信のみ対応しています。",
      previous_response_id: null
    });
  }

  try {
    const { message, previous_response_id } = req.body || {};

    if (!message) {
      return res.status(400).json({
        reply: "メッセージがありません。",
        previous_response_id: null
      });
    }

    const systemPrompt = `
あなたはロードサービスの受付AIです。
目的は、お客様の状況を簡潔に確認し、電話・LINE・問い合わせフォームへ自然につなげることです。

ルール：
- 丁寧で短く返答する
- 1回で質問は1〜2個まで
- まずは以下を順番に確認する
  1. トラブル内容
  2. 現在地
  3. 車種
  4. お急ぎかどうか
  5. 車がある場所（必要なら）
- 情報がそろってきたら
  「ありがとうございます。担当よりご案内しやすい状態です。お急ぎの場合はお電話、文字で残したい場合はLINEまたはフォームからご連絡ください。」
  と案内する
- 事故や高速道路上など危険な状況なら、安全確保を優先するよう短く伝える
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        previous_response_id: previous_response_id || undefined
      })
    });

    const data = await response.json();

    return res.status(200).json({
      reply:
        data.output_text ||
        "ご相談ありがとうございます。まずは現在地とお車の状況を教えてください。",
      previous_response_id: data.id || null
    });
  } catch (error) {
    return res.status(500).json({
      reply:
        "申し訳ありません。現在うまく応答できません。お急ぎの場合はお電話、文字でのご相談はLINEまたはフォームをご利用ください。",
      previous_response_id: null
    });
  }
}
