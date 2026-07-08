import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GradingResult {
  score: number;
  feedback: string;
  details: string;
}

export async function gradeSubmission({
  answerKey,
  answerKeyImageUrl,
  studentImageUrl,
}: {
  answerKey: string;
  answerKeyImageUrl?: string | null;
  studentImageUrl: string;
}): Promise<GradingResult> {
  // Build the content parts
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // System prompt
  parts.push({
    text: `Bạn là một giáo viên công bằng và khích lệ, đang chấm bài tập của học sinh.

HƯỚNG DẪN CHẤM ĐIỂM:
1. Thực hiện OCR (nhận dạng ký tự) trên ảnh bài tập của học sinh để trích xuất câu trả lời.
2. So sánh từng câu trả lời với Đáp Án được cung cấp bên dưới.
3. Chấm điểm từ 0 đến 100.
4. Đưa ra nhận xét MÔ PHẠM bằng tiếng Việt, bao gồm:
   - Những điểm học sinh làm tốt
   - Những lỗi cụ thể và cách sửa
   - Lời động viên, khích lệ

ĐÁP ÁN (Answer Key):
${answerKey}

Bài tập của học sinh sẽ được cung cấp dưới dạng hình ảnh bên dưới.

Trả lời CHÍNH XÁC dưới dạng JSON với cấu trúc:
{
  "score": <số từ 0 đến 100>,
  "feedback": "<nhận xét chi tiết bằng tiếng Việt>",
  "details": "<phân tích chi tiết từng câu>"
}

CHỈ trả lời JSON, không thêm markdown hay text khác.`,
  });

  // Add answer key image if available
  if (answerKeyImageUrl) {
    try {
      const answerImageData = await fetchImageAsBase64(answerKeyImageUrl);
      if (answerImageData) {
        parts.push({ text: '\n\nĐÁP ÁN (Hình ảnh):' });
        parts.push({
          inlineData: {
            mimeType: answerImageData.mimeType,
            data: answerImageData.base64,
          },
        });
      }
    } catch (err) {
      console.error('Failed to fetch answer key image:', err);
    }
  }

  // Add student submission image
  parts.push({ text: '\n\nBÀI TẬP CỦA HỌC SINH:' });
  const studentImageData = await fetchImageAsBase64(studentImageUrl);
  if (!studentImageData) {
    throw new Error('Could not fetch student submission image');
  }
  parts.push({
    inlineData: {
      mimeType: studentImageData.mimeType,
      data: studentImageData.base64,
    },
  });

  // Call Gemini
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts }],
    config: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  const responseText = response.text || '';

  // Parse JSON from response
  try {
    // Try to extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as GradingResult;

    // Validate score is within range
    parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

    return parsed;
  } catch (parseError) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('Failed to parse AI grading response');
  }
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return { base64, mimeType: contentType };
  } catch {
    return null;
  }
}
