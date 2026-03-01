/**
 * Componente: Minigame Quiz de Beleza
 *
 * Jogo de perguntas e respostas sobre beleza e cuidados.
 * O cliente tem um tempo limitado para responder. Respostas corretas
 * dao mais moedas, erradas dao menos. Pode jogar uma vez por dia.
 *
 * Props:
 * - disabled: Se o cliente ja jogou hoje
 * - currentCoins: Saldo atual de moedas
 * - onResult: Callback chamado quando a resposta eh processada com coins ganhos
 *
 * Estados:
 * - Tela inicial: botao para comcar o quiz
 * - Tela de pergunta: pergunta com 4 opcoes de resposta e timer
 * - Tela de resultado: exibe se acertou, moedas ganhas e feedback
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CoinBalance } from "./CoinBalance";
import { toast } from "sonner";
import { Timer, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface QuizGameProps {
  disabled?: boolean;
  currentCoins: number;
  onResult: (coins: number) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty: string;
}

export function QuizGame({ disabled = false, currentCoins, onResult }: QuizGameProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(disabled);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [timeLimit, setTimeLimit] = useState(15);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    correctIndex: number;
    coins: number;
    timedOut: boolean;
  } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega uma nova pergunta da API
  const fetchQuestion = useCallback(async () => {
    if (isLoading || hasPlayed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/games/quiz/question");
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erro ao carregar pergunta");
        setHasPlayed(true);
        return;
      }

      setQuestion({
        id: data.question.id,
        question: data.question.question,
        options: data.question.options as string[],
        category: data.question.category,
        difficulty: data.question.difficulty,
      });
      setTimeLimit(data.config.time_limit_seconds);
      setTimeLeft(data.config.time_limit_seconds);
    } catch {
      toast.error("Erro de conexao.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasPlayed]);

  // Effect para o timer que faz contagem regressiva
  useEffect(() => {
    if (!question || result || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Tempo esgotado - submete resposta automaticamente
          clearInterval(timerRef.current!);
          submitAnswer(null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submete a resposta selecionada para validacao
  const submitAnswer = async (answerIndex: number | null, timedOut = false) => {
    if (result || !question) return;

    if (timerRef.current) clearInterval(timerRef.current);

    if (answerIndex !== null) {
      setSelectedAnswer(answerIndex);
    }

    try {
      const res = await fetch("/api/games/quiz/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          answer_index: answerIndex ?? 0,
          timed_out: timedOut,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erro ao enviar resposta");
        return;
      }

      setResult({
        correct: data.correct,
        correctIndex: data.correct_index,
        coins: data.coins_earned,
        timedOut: data.timed_out,
      });
      setHasPlayed(true);
      onResult(data.coins_earned);

      if (data.timed_out) {
        toast.info(`Tempo esgotado! +${data.coins_earned} moedas`);
      } else if (data.correct) {
        toast.success(`Correto! +${data.coins_earned} moedas`);
      } else {
        toast.info(`Errou! +${data.coins_earned} moedas de participacao`);
      }
    } catch {
      toast.error("Erro de conexao.");
    }
  };

  // Calcula a porcentagem de tempo restante e determina a cor da barra
  const timerPercent = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;
  const timerColor = timeLeft <= 5 ? "bg-red-500" : timeLeft <= 10 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Exibe saldo atual de moedas */}
      <CoinBalance coins={currentCoins} size="lg" />

      {!question && !hasPlayed ? (
        /* Tela inicial - motiva o cliente a comcar o quiz */
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-dashed border-blue-300">
            <div className="text-center">
              <span className="text-4xl">🧠</span>
              <p className="mt-2 text-sm font-medium text-blue-600">Quiz de Beleza</p>
            </div>
          </div>

          <Button
            onClick={fetchQuestion}
            disabled={isLoading}
            size="lg"
            className="w-full max-w-xs text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-indigo-600"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando...
              </span>
            ) : (
              "Comecar Quiz"
            )}
          </Button>
        </div>
      ) : hasPlayed && !question ? (
        /* Tela de ja jogou - cliente nao pode jogar mais hoje */
        <div className="text-center">
          <p className="text-lg text-gray-500">Voce ja jogou o quiz hoje. Volte amanha!</p>
        </div>
      ) : question ? (
        /* Tela de pergunta - exibe a pergunta e opcoes de resposta */
        <div className="w-full max-w-md space-y-4">
          {/* Barra de tempo com countdown */}
          {!result && (
            <div className="space-y-1">
              {/* Timer com segundos restantes e categoria */}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-500">
                  <Timer className="h-4 w-4" />
                  {timeLeft}s
                </span>
                <span className="text-xs text-gray-400">{question.category}</span>
              </div>
              {/* Barra de progresso de tempo com cor dinamica */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  className={`h-full rounded-full ${timerColor}`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${timerPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Caixa com a pergunta */}
          <div className="rounded-xl bg-white p-5 shadow-sm border">
            <p className="text-base font-medium text-gray-900">{question.question}</p>
          </div>

          {/* Opcoes de resposta (A, B, C, D) */}
          <div className="space-y-2">
            {(question.options as string[]).map((option, index) => {
              // Define estilo do botao baseado no estado (selecionado, resultado, padrao)
              let btnClass = "border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300";

              if (result) {
                if (index === result.correctIndex) {
                  btnClass = "border-green-400 bg-green-50 text-green-800";
                } else if (index === selectedAnswer && !result.correct) {
                  btnClass = "border-red-400 bg-red-50 text-red-800";
                } else {
                  btnClass = "border-gray-200 bg-gray-50 text-gray-400";
                }
              } else if (selectedAnswer === index) {
                btnClass = "border-blue-400 bg-blue-50";
              }

              return (
                <motion.button
                  key={index}
                  whileTap={!result ? { scale: 0.98 } : {}}
                  onClick={() => !result && submitAnswer(index)}
                  disabled={!!result}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${btnClass}`}
                >
                  {/* Letra da opcao (A, B, C, D) */}
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm">{option}</span>
                  {/* Icone de correto ou errado apos responder */}
                  {result && index === result.correctIndex && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                  )}
                  {result && index === selectedAnswer && !result.correct && (
                    <XCircle className="ml-auto h-5 w-5 text-red-500" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Card de resultado com feedback */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 text-center"
              >
                {result.timedOut ? (
                  <p className="text-lg font-semibold text-gray-500">Tempo esgotado!</p>
                ) : result.correct ? (
                  <p className="text-lg font-semibold text-green-600">Resposta correta!</p>
                ) : (
                  <p className="text-lg font-semibold text-red-500">Resposta errada!</p>
                )}
                <p className="mt-1 text-amber-600 font-bold">+{result.coins} moedas</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
