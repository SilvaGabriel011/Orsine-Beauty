/**
 * Catalogo centralizado de erros da aplicacao.
 *
 * Convencao de codigos:
 *   AUTH_xxx  — autenticacao / autorizacao
 *   VAL_xxx   — validacao de dados
 *   RES_xxx   — recurso (CRUD)
 *   APPT_xxx  — agendamentos
 *   REV_xxx   — avaliacoes
 *   PAY_xxx   — pagamentos
 *   LOY_xxx   — fidelidade
 *   INT_xxx   — integracoes externas (calendar, email, whatsapp)
 *   SYS_xxx   — erros de sistema / infraestrutura
 */

export type ErrorCode = keyof typeof ERROR_CATALOG;

export interface ErrorDef {
  /** Mensagem amigavel para o usuario */
  message: string;
  /** HTTP status code padrao */
  status: number;
}

export const ERROR_CATALOG = {
  // ── Autenticacao ──────────────────────────────────────────
  AUTH_NOT_AUTHENTICATED: {
    message: "Faca login para continuar",
    status: 401,
  },
  AUTH_NOT_AUTHORIZED: {
    message: "Voce nao tem permissao para esta acao",
    status: 403,
  },
  AUTH_SESSION_EXPIRED: {
    message: "Sua sessao expirou. Faca login novamente",
    status: 401,
  },
  AUTH_INVALID_CREDENTIALS: {
    message: "Email ou senha incorretos",
    status: 401,
  },

  // ── Validacao ─────────────────────────────────────────────
  VAL_MISSING_FIELDS: {
    message: "Campos obrigatorios nao preenchidos",
    status: 400,
  },
  VAL_INVALID_FORMAT: {
    message: "Formato de dados invalido",
    status: 400,
  },
  VAL_INVALID_ID: {
    message: "Identificador invalido",
    status: 400,
  },

  // ── Recursos (CRUD generico) ──────────────────────────────
  RES_NOT_FOUND: {
    message: "Recurso nao encontrado",
    status: 404,
  },
  RES_ALREADY_EXISTS: {
    message: "Este registro ja existe",
    status: 409,
  },
  RES_CREATE_FAILED: {
    message: "Erro ao criar registro",
    status: 500,
  },
  RES_UPDATE_FAILED: {
    message: "Erro ao atualizar registro",
    status: 500,
  },
  RES_DELETE_FAILED: {
    message: "Erro ao remover registro",
    status: 500,
  },

  // ── Agendamentos ──────────────────────────────────────────
  APPT_SLOT_TAKEN: {
    message: "Este horario ja esta ocupado",
    status: 409,
  },
  APPT_CANCEL_TOO_LATE: {
    message: "Nao e possivel cancelar com menos de 24h de antecedencia",
    status: 400,
  },
  APPT_NOT_FOUND: {
    message: "Agendamento nao encontrado",
    status: 404,
  },
  APPT_INVALID_STATUS: {
    message: "Status de agendamento invalido",
    status: 400,
  },
  APPT_SERVICE_NOT_FOUND: {
    message: "Um ou mais servicos nao encontrados",
    status: 404,
  },
  APPT_MISSING_DATETIME: {
    message: "Data, hora inicio e fim sao obrigatorios",
    status: 400,
  },
  APPT_MISSING_SERVICES: {
    message: "Selecione pelo menos um servico",
    status: 400,
  },

  // ── Categorias / Servicos ─────────────────────────────────
  CAT_NAME_REQUIRED: {
    message: "Nome e slug sao obrigatorios",
    status: 400,
  },
  SVC_FIELDS_REQUIRED: {
    message: "Categoria, nome e preco sao obrigatorios",
    status: 400,
  },

  // ── Avaliacoes ────────────────────────────────────────────
  REV_INVALID_RATING: {
    message: "Nota deve ser entre 1 e 5",
    status: 400,
  },
  REV_ALREADY_REVIEWED: {
    message: "Voce ja avaliou este atendimento",
    status: 409,
  },
  REV_NOT_OWNER: {
    message: "Voce nao pode avaliar este agendamento",
    status: 403,
  },
  REV_NOT_COMPLETED: {
    message: "Somente atendimentos concluidos podem ser avaliados",
    status: 400,
  },
  REV_NO_SERVICE: {
    message: "Servico nao encontrado para este agendamento",
    status: 400,
  },

  // ── Pagamentos ────────────────────────────────────────────
  PAY_FAILED: {
    message: "Erro ao processar pagamento",
    status: 500,
  },
  PAY_INVALID_METHOD: {
    message: "Metodo de pagamento invalido",
    status: 400,
  },

  // ── Fidelidade ────────────────────────────────────────────
  LOY_INSUFFICIENT_POINTS: {
    message: "Pontos insuficientes para resgate",
    status: 400,
  },
  LOY_RULE_NOT_FOUND: {
    message: "Regra de fidelidade nao encontrada",
    status: 404,
  },

  // ── Integracoes externas ──────────────────────────────────
  INT_CALENDAR_FAILED: {
    message: "Erro ao sincronizar com Google Calendar",
    status: 502,
  },
  INT_EMAIL_FAILED: {
    message: "Erro ao enviar email",
    status: 502,
  },
  INT_WHATSAPP_FAILED: {
    message: "Erro ao enviar mensagem WhatsApp",
    status: 502,
  },

  // ── Gamificacao ─────────────────────────────────────────
  GAME_ALREADY_PLAYED: {
    message: "Voce ja jogou este jogo hoje. Volte amanha!",
    status: 400,
  },
  GAME_DISABLED: {
    message: "Este jogo esta desabilitado no momento",
    status: 400,
  },
  GAME_ALREADY_CHECKED_IN: {
    message: "Voce ja fez check-in hoje. Volte amanha!",
    status: 400,
  },
  GAME_INSUFFICIENT_COINS: {
    message: "Moedas insuficientes para esta troca",
    status: 400,
  },
  GAME_ITEM_NOT_FOUND: {
    message: "Item nao encontrado na loja",
    status: 404,
  },
  GAME_ITEM_OUT_OF_STOCK: {
    message: "Este item esta esgotado",
    status: 400,
  },
  GAME_INVALID_ANSWER: {
    message: "Resposta invalida",
    status: 400,
  },
  GAME_NO_QUESTION: {
    message: "Nenhuma pergunta disponivel no momento",
    status: 404,
  },

  // ── Sistema / Inesperados ─────────────────────────────────
  SYS_INTERNAL: {
    message: "Erro interno do servidor",
    status: 500,
  },
  SYS_DATABASE: {
    message: "Erro de comunicacao com o banco de dados",
    status: 500,
  },
  SYS_CONFIG_MISSING: {
    message: "Configuracao do sistema incompleta",
    status: 500,
  },
  SYS_RATE_LIMIT: {
    message: "Muitas requisicoes. Tente novamente em alguns minutos",
    status: 429,
  },
  SYS_UPLOAD_FAILED: {
    message: "Erro ao fazer upload do arquivo",
    status: 500,
  },
  SYS_INVALID_JSON: {
    message: "Corpo da requisicao invalido",
    status: 400,
  },
} as const satisfies Record<string, ErrorDef>;
