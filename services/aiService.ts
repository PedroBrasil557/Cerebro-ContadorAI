import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa a API com a chave do arquivo .env.local
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY!);

export const aiService = {
  async sendMessage(message: string) {
    try {
      // --- CORREÇÃO DEFINITIVA ---
      // Usamos "gemini-pro". Este é o modelo padrão 1.0 que funciona em TODAS as contas gratuitas.
      // Os modelos "flash" ou "1.5" as vezes dão erro 404 em chaves novas/gratuitas.
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Você é o assistente financeiro do sistema "Cérebro.AI".
        Seu objetivo é ajudar o usuário (Pedro) a gerenciar suas finanças e agendamentos.
        Responda de forma curta (máx 3 frases), direta e motivadora.
        O usuário perguntou: ${message}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error: any) {
      console.error("Erro na IA:", error);
      
      // Mensagem de erro mais detalhada para te ajudar
      if (error.message?.includes('404')) {
         return "Erro de Modelo: Sua chave API não tem acesso a este modelo. Verifique no Google AI Studio se a API está ativa.";
      }
      
      return "Desculpe, minha conexão com o Google falhou. Tente novamente.";
    }
  }
};