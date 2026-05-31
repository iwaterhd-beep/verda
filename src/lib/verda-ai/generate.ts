import type { VerdaAiClubContext } from "@/lib/verda-ai/club-context";
import { formatClubContextForPrompt } from "@/lib/verda-ai/club-context";

export interface VerdaAiInsight {
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
}

export interface VerdaAiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildVerdaAiInsights(ctx: VerdaAiClubContext): VerdaAiInsight[] {
  const insights: VerdaAiInsight[] = [];

  if (ctx.pendingApplications > 0) {
    insights.push({
      title: "Solicitudes pendientes",
      body: `Tienes ${ctx.pendingApplications} solicitud${ctx.pendingApplications === 1 ? "" : "es"} de alta sin revisar. Conviene aprobarlas o rechazarlas pronto.`,
      priority: "high",
    });
  }

  if (ctx.preparingOrders > 0) {
    insights.push({
      title: "Pedidos en cocina",
      body: `${ctx.preparingOrders} pedido${ctx.preparingOrders === 1 ? "" : "s"} en preparación. Revisa Pedidos para marcarlos listos.`,
      priority: "high",
    });
  }

  if (ctx.readyOrders > 0) {
    insights.push({
      title: "Listos para recoger",
      body: `${ctx.readyOrders} pedido${ctx.readyOrders === 1 ? "" : "s"} esperando recogida por los socios.`,
      priority: "medium",
    });
  }

  if (ctx.lowStockProducts.length > 0) {
    const names = ctx.lowStockProducts
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ");
    insights.push({
      title: "Stock bajo",
      body: `${ctx.lowStockProducts.length} producto${ctx.lowStockProducts.length === 1 ? "" : "s"} por debajo del umbral (${names}${ctx.lowStockProducts.length > 3 ? "…" : ""}).`,
      priority: "high",
    });
  }

  if (ctx.monthRevenueDelta <= -15 && ctx.monthRevenue > 0) {
    insights.push({
      title: "Ingresos en bajada",
      body: `Los ingresos del mes van un ${Math.abs(ctx.monthRevenueDelta)}% por debajo del mes pasado. Revisa menú, stock y promociones.`,
      priority: "medium",
    });
  }

  if (ctx.monthRevenueDelta >= 15 && ctx.monthRevenue > 0) {
    insights.push({
      title: "Buen ritmo de ingresos",
      body: `Ingresos del mes +${ctx.monthRevenueDelta}% respecto al mes anterior. Buen momento para destacar productos en el menú.`,
      priority: "low",
    });
  }

  if (ctx.ordersToday === 0 && ctx.activeMembers > 0) {
    insights.push({
      title: "Sin pedidos hoy",
      body: "Aún no hay pedidos hoy. Puedes avisar a los socios o revisar productos ocultos o agotados.",
      priority: "low",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Todo en orden",
      body: `${ctx.clubName} va bien: ${ctx.activeMembers} socios activos, inventario estable y sin urgencias operativas.`,
      priority: "low",
    });
  }

  return insights.slice(0, 5);
}

export function buildSuggestedQuestions(ctx: VerdaAiClubContext): string[] {
  const questions = [
    "¿Qué debería priorizar hoy?",
    "Resumen del club",
  ];

  if (ctx.pendingApplications > 0) {
    questions.push("¿Cuántas solicitudes tengo pendientes?");
  }
  if (ctx.lowStockProducts.length > 0) {
    questions.push("¿Qué productos tienen stock bajo?");
  }
  if (ctx.preparingOrders > 0) {
    questions.push("¿Hay pedidos sin preparar?");
  }

  return questions.slice(0, 4);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function answerWithRules(
  ctx: VerdaAiClubContext,
  question: string,
): string | null {
  const q = question.toLowerCase();

  if (/priorizar|urgente|hoy|importante/.test(q)) {
    const parts: string[] = [];
    if (ctx.pendingApplications > 0) {
      parts.push(`revisar ${ctx.pendingApplications} solicitud(es) en Solicitudes`);
    }
    if (ctx.preparingOrders > 0) {
      parts.push(`preparar ${ctx.preparingOrders} pedido(s) en Pedidos`);
    }
    if (ctx.lowStockProducts.length > 0) {
      parts.push(`reponer stock (${ctx.lowStockProducts[0]?.name} y otros)`);
    }
    if (parts.length === 0) {
      return "Hoy no hay urgencias claras. Puedes revisar el menú del portal, actualizar fotos de productos o contactar socios inactivos.";
    }
    return `Prioriza: ${parts.join("; ")}.`;
  }

  if (/resumen|overview|estado|cómo va|como va/.test(q)) {
    return [
      `**${ctx.clubName}** — ${ctx.activeMembers} socios activos.`,
      `Ingresos del mes: ${formatCurrency(ctx.monthRevenue)} (${ctx.monthRevenueDelta >= 0 ? "+" : ""}${ctx.monthRevenueDelta}%).`,
      `Pedidos hoy: ${ctx.ordersToday}. En preparación: ${ctx.preparingOrders}, listos: ${ctx.readyOrders}.`,
      ctx.pendingApplications > 0
        ? `${ctx.pendingApplications} solicitud(es) pendiente(s).`
        : "Sin solicitudes pendientes.",
    ].join(" ");
  }

  if (/solicitud|alta|aplicacion|aplicación/.test(q)) {
    if (ctx.pendingApplications === 0) {
      return "No tienes solicitudes de socio pendientes.";
    }
    return `Hay ${ctx.pendingApplications} solicitud(es) pendiente(s). Entra en Solicitudes para aprobar o rechazar.`;
  }

  if (/stock|inventario|producto|agot/.test(q)) {
    if (ctx.lowStockProducts.length === 0) {
      return `Tienes ${ctx.productCount} productos y ninguno está por debajo del umbral de stock bajo.`;
    }
    const list = ctx.lowStockProducts
      .map((p) => `• ${p.name}: ${p.stock} (umbral ${p.threshold})`)
      .join("\n");
    return `Productos con stock bajo:\n${list}`;
  }

  if (/pedido|prepar|recog/.test(q)) {
    return `Hoy: ${ctx.ordersToday} pedido(s). ${ctx.preparingOrders} en preparación y ${ctx.readyOrders} listos para recoger.${
      ctx.recentOrderCodes.length
        ? ` Recientes: ${ctx.recentOrderCodes.join(", ")}.`
        : ""
    }`;
  }

  if (/ingreso|factur|venta|dinero|crd/.test(q)) {
    return `Ingresos del mes: ${formatCurrency(ctx.monthRevenue)} (${ctx.monthRevenueDelta >= 0 ? "+" : ""}${ctx.monthRevenueDelta}% vs mes anterior). Ticket medio últimos pedidos disponible en el dashboard.`;
  }

  if (/socio|miembro|activo/.test(q)) {
    return `${ctx.activeMembers} socios activos en ${ctx.clubName}.${ctx.pendingApplications > 0 ? ` Además, ${ctx.pendingApplications} solicitud(es) esperando revisión.` : ""}`;
  }

  if (/ocult|portal|menú|menu/.test(q)) {
    return `${ctx.hiddenProductCount} producto(s) ocultos al portal (solo staff puede dispensarlos). El resto (${ctx.productCount - ctx.hiddenProductCount}) puede estar visible según stock y configuración.`;
  }

  return null;
}

async function callOpenAi(
  ctx: VerdaAiClubContext,
  messages: VerdaAiChatMessage[],
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const system = `Eres Verda AI, asistente del panel de administración de un club cannábico en España.
Responde siempre en español, claro y breve (máximo 3 párrafos cortos).
Usa SOLO los datos del contexto del club. No inventes cifras ni nombres.
Enfócate en operaciones: socios, pedidos, inventario, solicitudes.
No des consejos médicos ni legales.

Contexto actual del club:
${formatClubContextForPrompt(ctx)}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Verda AI OpenAI error:", err);
    return null;
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function generateVerdaAiReply(
  ctx: VerdaAiClubContext,
  messages: VerdaAiChatMessage[],
): Promise<{ reply: string; usedLlm: boolean }> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return {
      reply: "Escribe una pregunta sobre tu club y te ayudo con datos reales.",
      usedLlm: false,
    };
  }

  const llmReply = await callOpenAi(ctx, messages);
  if (llmReply) return { reply: llmReply, usedLlm: true };

  const ruleReply = answerWithRules(ctx, lastUser.content);
  if (ruleReply) return { reply: ruleReply, usedLlm: false };

  return {
    reply:
      "Puedo ayudarte con solicitudes, pedidos, stock, ingresos y socios. Prueba: «¿Qué debería priorizar hoy?» o «Resumen del club».",
    usedLlm: false,
  };
}

export function buildWelcomeMessage(ctx: VerdaAiClubContext): string {
  const insights = buildVerdaAiInsights(ctx);
  const top = insights.find((i) => i.priority === "high") ?? insights[0];
  return `Hola ${ctx.userName.split(" ")[0]}. Soy **Verda AI** para **${ctx.clubName}**.\n\n${top.body}\n\nPregúntame lo que necesites o usa una sugerencia abajo.`;
}
