export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      reply: "POST送信のみ対応しています。",
      previous_response_id: null,
    });
  }

  try {
    const { message, previous_response_id } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: message,
        previous_response_id: previous_response_id || undefined,
      }),
    });

    const data = await response.json();

    const reply =
      data.output?.[0]?.content?.[0]?.text ||
      "申し訳ありません。うまく返答できませんでした。";

    return res.status(200).json({
      reply,
      previous_response_id: data.id || null,
    });
  } catch (error) {
    return res.status(500).json({
      reply: "サーバーエラーが発生しました。",
      previous_response_id: null,
    });
  }
}
