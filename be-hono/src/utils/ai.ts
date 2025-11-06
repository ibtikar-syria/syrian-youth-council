import type { Request, Tag } from '../db/schema';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data: DeepSeekResponse = await response.json();
    return data.choices[0].message.content;
  }

  async analyzeRequest(request: Request, existingTags: Tag[]): Promise<string[]> {
    const tagsList = existingTags.map(t => `${t.name} (${t.nameAr})`).join(', ');
    
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `أنت مساعد ذكي يحلل طلبات الشباب السوري. مهمتك هي تحليل الطلب واختيار أو اقتراح الوسوم (Tags) المناسبة.
الوسوم الموجودة حالياً: ${tagsList || 'لا توجد وسوم بعد'}
إذا كان الطلب يتطابق مع وسم موجود، استخدمه. إذا لم يكن هناك وسم مناسب، اقترح وسماً جديداً.
أرجع فقط قائمة بأسماء الوسوم (بالإنجليزية) مفصولة بفواصل، مثال: education,scholarship,travel`,
      },
      {
        role: 'user',
        content: `العنوان: ${request.title}\n\nالمحتوى: ${request.content}`,
      },
    ];

    const result = await this.callDeepSeek(messages);
    return result.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  async findSimilarRequests(request: Request, otherRequests: Request[]): Promise<number[]> {
    if (otherRequests.length === 0) return [];

    const requestsList = otherRequests.map((r, idx) => 
      `${idx + 1}. [${r.id}] ${r.title}: ${r.content.substring(0, 100)}...`
    ).join('\n');

    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `أنت مساعد ذكي يبحث عن الطلبات المتشابهة. مهمتك هي تحديد أي من الطلبات التالية مشابهة للطلب المعطى.
أرجع فقط أرقام معرفات الطلبات (IDs) المشابهة مفصولة بفواصل. إذا لم تجد طلبات مشابهة، أرجع "none".`,
      },
      {
        role: 'user',
        content: `الطلب المرجعي:\nالعنوان: ${request.title}\nالمحتوى: ${request.content}\n\nالطلبات الأخرى:\n${requestsList}`,
      },
    ];

    const result = await this.callDeepSeek(messages);
    
    if (result.toLowerCase() === 'none') return [];
    
    return result
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));
  }

  async generateGroupSummary(requests: Request[]): Promise<{ title: string; description: string }> {
    const requestsList = requests.map(r => `- ${r.title}: ${r.content}`).join('\n');

    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `أنت مساعد ذكي يقوم بتلخيص مجموعة من الطلبات المتشابهة. مهمتك هي إنشاء عنوان ووصف موجز للمجموعة.
أرجع النتيجة بصيغة JSON فقط: {"title": "العنوان", "description": "الوصف"}`,
      },
      {
        role: 'user',
        content: `الطلبات:\n${requestsList}`,
      },
    ];

    const result = await this.callDeepSeek(messages);
    
    try {
      const parsed = JSON.parse(result);
      return {
        title: parsed.title || 'مجموعة طلبات مشابهة',
        description: parsed.description || '',
      };
    } catch {
      return {
        title: 'مجموعة طلبات مشابهة',
        description: result,
      };
    }
  }

  async generatePersonalizedResponse(
    request: Request,
    ministryResponse: string
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `أنت مساعد ذكي يقوم بتخصيص الردود من وزارة الشباب للشباب السوري. مهمتك هي أخذ الرد العام من الوزارة وتخصيصه ليناسب الطلب الفردي.
اجعل الرد شخصياً ومباشراً، وتأكد من الإجابة على النقاط المحددة في الطلب.`,
      },
      {
        role: 'user',
        content: `الطلب الأصلي:\nالعنوان: ${request.title}\nالمحتوى: ${request.content}\n\nرد الوزارة: ${ministryResponse}`,
      },
    ];

    return await this.callDeepSeek(messages);
  }

  async generateTagTranslation(englishTag: string): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'أنت مترجم. قم بترجمة الوسم (Tag) التالي إلى العربية. أرجع فقط الترجمة بدون أي نص إضافي.',
      },
      {
        role: 'user',
        content: englishTag,
      },
    ];

    return await this.callDeepSeek(messages);
  }
}
