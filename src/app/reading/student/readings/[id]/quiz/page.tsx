"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReadingAPI } from "@/lib/readings";
import type { QuizResult, QuizResultDetail } from "@/app/reading/student/readings/[id]/page";

interface Question {
    id: string;
    text: string;
    questionType: string;
    options?: string[];
}

type AnswerMap = Record<string, string>;

export default function StudentQuizPage() {
    const router = useRouter();
    const params = useParams();
    const readingId = params.id as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerMap>({});
    const [timeTakenSeconds, setTimeTakenSeconds] = useState(0);
    const [quizDurationMinutes, setQuizDurationMinutes] = useState(10);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const autoSubmittedRef = useRef(false);

    const quizDurationSeconds = quizDurationMinutes * 60;
    const remainingSeconds = Math.max(quizDurationSeconds - timeTakenSeconds, 0);
    const currentQuestion = questions[currentIndex];
    const progress = useMemo(() => {
        if (questions.length === 0) return 0;
        return ((currentIndex + 1) / questions.length) * 100;
    }, [currentIndex, questions.length]);

    useEffect(() => {
        async function fetchQuestions() {
            try {
                setLoading(true);
                const [readingData, questionData] = await Promise.all([
                    ReadingAPI.getStudentReadingById(readingId),
                    ReadingAPI.getQuizQuestions(readingId),
                ]);
                setQuizDurationMinutes(Math.max(1, Number(readingData?.quizDurationMinutes) || 10));
                setQuestions(questionData);
            } catch (err: any) {
                await handleQuestionLoadError(err, readingId, setResult, setSubmitted, setError);
            } finally {
                setLoading(false);
            }
        }

        if (readingId) fetchQuestions();
    }, [readingId]);

    useEffect(() => {
        if (loading || submitted || questions.length === 0) return undefined;

        const timer = setInterval(() => {
            setTimeTakenSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, submitted, questions.length]);

    useEffect(() => {
        if (shouldAutoSubmit({ loading, submitted, submitting, questions, remainingSeconds, autoSubmitted: autoSubmittedRef.current })) {
            autoSubmittedRef.current = true;
            handleSubmit(true);
        }
    }, [loading, remainingSeconds, questions, submitted, submitting]);

    const handleAnswer = (value: string) => {
        if (!currentQuestion) return;
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        const cappedTime = Math.min(timeTakenSeconds, quizDurationSeconds);

        try {
            setSubmitting(true);
            const submitResponse = await ReadingAPI.submitQuiz(readingId, {
                answers,
                timeTakenSeconds: cappedTime,
            });

            try {
                setResult(await ReadingAPI.getQuizResult(readingId));
            } catch {
                setResult(createFallbackResult(readingId, submitResponse, cappedTime));
            }
            setSubmitted(true);
        } catch (err: any) {
            const prefix = isAutoSubmit
                ? "Time is up, but the quiz could not be submitted: "
                : "Failed to submit quiz: ";
            alert(`${prefix}${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <CenteredMessage message="Loading quiz..." />;

    if (error) {
        return <QuizErrorView error={error} readingId={readingId} onBack={router.push} />;
    }

    if (questions.length === 0) {
        return <CenteredMessage message="No questions available." />;
    }

    if (submitted && result) {
        return (
            <SubmittedResultView
                result={result}
                readingId={readingId}
                elapsedSeconds={timeTakenSeconds}
                onBack={router.push}
            />
        );
    }

    return (
        <QuizTakingView
            answers={answers}
            currentIndex={currentIndex}
            currentQuestion={currentQuestion}
            onAnswer={handleAnswer}
            onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            onSubmit={() => handleSubmit()}
            onJump={setCurrentIndex}
            progress={progress}
            questions={questions}
            remainingSeconds={remainingSeconds}
            submitting={submitting}
        />
    );
}

async function handleQuestionLoadError(
    err: any,
    readingId: string,
    setResult: (result: QuizResult) => void,
    setSubmitted: (submitted: boolean) => void,
    setError: (error: string) => void,
) {
    if (err.message?.toLowerCase().includes("completed")) {
        try {
            setResult(await ReadingAPI.getQuizResult(readingId));
            setSubmitted(true);
            return;
        } catch (resultErr) {
            console.error("Failed to fetch result:", resultErr);
        }
    }

    setError(err.message || "Failed to load questions");
}

function shouldAutoSubmit({
    loading,
    submitted,
    submitting,
    questions,
    remainingSeconds,
    autoSubmitted,
}: Readonly<{
    loading: boolean;
    submitted: boolean;
    submitting: boolean;
    questions: Question[];
    remainingSeconds: number;
    autoSubmitted: boolean;
}>) {
    return !loading && !submitted && !submitting && questions.length > 0 && !autoSubmitted && remainingSeconds <= 0;
}

function createFallbackResult(readingId: string, submitResponse: any, timeTakenSeconds: number): QuizResult {
    return {
        readingId,
        score: submitResponse.score,
        accuracy: submitResponse.accuracy,
        totalQuestions: submitResponse.totalQuestions,
        correctAnswers: submitResponse.correctAnswers,
        timeTakenSeconds,
        completedAt: new Date().toISOString(),
        questionDetails: [],
    };
}

function CenteredMessage({ message }: Readonly<{ message: string }>) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            {message}
        </div>
    );
}

function QuizErrorView({
    error,
    readingId,
    onBack,
}: Readonly<{
    error: string;
    readingId: string;
    onBack: (href: string) => void;
}>) {
    const isCompleted = error.toLowerCase().includes("completed");
    const iconClass = isCompleted ? "bg-indigo-100 text-indigo-600" : "bg-rose-100 text-rose-600";
    const title = isCompleted ? "Quiz Already Completed" : "Oops! Something went wrong";
    const message = isCompleted
        ? "You have already taken the quiz for this reading material. Go back to see your result."
        : error.replace(/API Error: \d+ - /, "");

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-3xl shadow-lg border border-slate-200 p-8 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${iconClass}`}>
                    {isCompleted ? <CompletedIcon /> : <WarningIcon />}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">{title}</h2>
                <p className="text-slate-500 mb-8">{message}</p>
                <button
                    onClick={() => onBack(`/reading/student/readings/${readingId}`)}
                    className="px-6 py-3 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm"
                >
                    Back to Reading
                </button>
            </div>
        </div>
    );
}

function SubmittedResultView({
    result,
    readingId,
    elapsedSeconds,
    onBack,
}: Readonly<{
    result: QuizResult;
    readingId: string;
    elapsedSeconds: number;
    onBack: (href: string) => void;
}>) {
    const { scoreColor, scoreBg } = getScoreStyles(result.score);
    const accuracy = normalizeAccuracy(result.accuracy).toFixed(1);
    const timeTaken = formatTime(result.timeTakenSeconds ?? elapsedSeconds);

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CompletedIcon className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">Quiz Submitted!</h1>
                    <p className="text-slate-400 text-sm mb-6">{formatCompletedDate(result.completedAt)}</p>

                    <div className={`rounded-2xl border p-5 ${scoreBg} flex items-center justify-between flex-wrap gap-4 text-left mb-6`}>
                        <div className="flex items-center gap-4">
                            <div className={`text-5xl font-black ${scoreColor}`}>{result.score}</div>
                            <div className="text-sm text-slate-500 leading-relaxed">
                                <div className="font-semibold text-slate-700">
                                    {result.correctAnswers} / {result.totalQuestions} correct
                                </div>
                                <div>Accuracy: {accuracy}%</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 mb-6 text-sm text-slate-600">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span>Time Taken</span>
                            <span className="font-semibold">{timeTaken}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => onBack(`/reading/student/readings/${readingId}`)}
                        className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all w-full"
                    >
                        Back to Reading
                    </button>
                </div>

                {result.questionDetails.length > 0 && (
                    <AnswerBreakdown details={result.questionDetails} />
                )}
            </div>
        </div>
    );
}

function QuizTakingView({
    answers,
    currentIndex,
    currentQuestion,
    onAnswer,
    onPrevious,
    onNext,
    onSubmit,
    onJump,
    progress,
    questions,
    remainingSeconds,
    submitting,
}: Readonly<{
    answers: AnswerMap;
    currentIndex: number;
    currentQuestion: Question;
    onAnswer: (value: string) => void;
    onPrevious: () => void;
    onNext: () => void;
    onSubmit: () => void;
    onJump: (index: number) => void;
    progress: number;
    questions: Question[];
    remainingSeconds: number;
    submitting: boolean;
}>) {
    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <QuizHeader
                    currentIndex={currentIndex}
                    progress={progress}
                    questionCount={questions.length}
                    remainingSeconds={remainingSeconds}
                />
                <QuestionPanel
                    answers={answers}
                    currentIndex={currentIndex}
                    question={currentQuestion}
                    questionCount={questions.length}
                    onAnswer={onAnswer}
                    onPrevious={onPrevious}
                    onNext={onNext}
                    onSubmit={onSubmit}
                    submitting={submitting}
                />
                <QuizNavigation
                    answers={answers}
                    currentIndex={currentIndex}
                    questions={questions}
                    onJump={onJump}
                />
            </div>
        </div>
    );
}

function QuizHeader({
    currentIndex,
    progress,
    questionCount,
    remainingSeconds,
}: Readonly<{
    currentIndex: number;
    progress: number;
    questionCount: number;
    remainingSeconds: number;
}>) {
    const timeClass = remainingSeconds <= 60 ? "text-rose-600" : "text-slate-800";

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Reading Quiz</p>
                    <h1 className="text-3xl font-bold text-slate-900 mt-1">Reading Comprehension Test</h1>
                </div>
                <div className="flex gap-4">
                    <StatBox label="Time Left" value={formatTime(remainingSeconds)} valueClass={timeClass} />
                    <StatBox label="Question" value={`${currentIndex + 1} / ${questionCount}`} />
                </div>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

function StatBox({ label, value, valueClass = "text-slate-800" }: Readonly<{ label: string; value: string; valueClass?: string }>) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
        </div>
    );
}

function QuestionPanel({
    answers,
    currentIndex,
    question,
    questionCount,
    onAnswer,
    onPrevious,
    onNext,
    onSubmit,
    submitting,
}: Readonly<{
    answers: AnswerMap;
    currentIndex: number;
    question: Question;
    questionCount: number;
    onAnswer: (value: string) => void;
    onPrevious: () => void;
    onNext: () => void;
    onSubmit: () => void;
    submitting: boolean;
}>) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    {currentIndex + 1}
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
                    {question.questionType?.replace("_", " ") || "QUESTION"}
                </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-8">{question.text}</h2>
            <QuestionAnswerInput answers={answers} question={question} onAnswer={onAnswer} />
            <QuestionActions
                currentIndex={currentIndex}
                questionCount={questionCount}
                onNext={onNext}
                onPrevious={onPrevious}
                onSubmit={onSubmit}
                submitting={submitting}
            />
        </div>
    );
}

function QuestionAnswerInput({
    answers,
    question,
    onAnswer,
}: Readonly<{
    answers: AnswerMap;
    question: Question;
    onAnswer: (value: string) => void;
}>) {
    if (question.questionType === "MULTIPLE_CHOICE") {
        return <MultipleChoiceOptions answers={answers} question={question} onAnswer={onAnswer} />;
    }

    if (question.questionType === "TRUE_FALSE") {
        return <TrueFalseOptions answers={answers} question={question} onAnswer={onAnswer} />;
    }

    if (question.questionType === "ESSAY") {
        return (
            <textarea
                rows={6}
                value={answers[question.id] || ""}
                onChange={(e) => onAnswer(e.target.value)}
                placeholder="Write your answer here..."
                className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
        );
    }

    return null;
}

function MultipleChoiceOptions({
    answers,
    question,
    onAnswer,
}: Readonly<{
    answers: AnswerMap;
    question: Question;
    onAnswer: (value: string) => void;
}>) {
    return (
        <div className="space-y-4">
            {question.options?.map((option, index) => {
                const selected = answers[question.id] === option;
                const optionClass = selected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";

                return (
                    <button
                        key={option}
                        onClick={() => onAnswer(option)}
                        className={`w-full text-left rounded-2xl border p-5 transition-all ${optionClass}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                {getOptionLetter(index)}
                            </div>
                            <p className="font-medium text-slate-700">{option}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function TrueFalseOptions({
    answers,
    question,
    onAnswer,
}: Readonly<{
    answers: AnswerMap;
    question: Question;
    onAnswer: (value: string) => void;
}>) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {question.options?.map((option) => {
                const selected = answers[question.id] === option;
                return (
                    <button
                        key={option}
                        onClick={() => onAnswer(option)}
                        className={`rounded-2xl border p-8 text-center transition-all ${getTrueFalseOptionClass(selected, option)}`}
                    >
                        <p className="text-2xl font-bold text-slate-800">{option}</p>
                    </button>
                );
            })}
        </div>
    );
}

function QuestionActions({
    currentIndex,
    questionCount,
    onNext,
    onPrevious,
    onSubmit,
    submitting,
}: Readonly<{
    currentIndex: number;
    questionCount: number;
    onNext: () => void;
    onPrevious: () => void;
    onSubmit: () => void;
    submitting: boolean;
}>) {
    const isLastQuestion = currentIndex >= questionCount - 1;

    return (
        <div className="flex items-center justify-between mt-10 gap-4 flex-wrap">
            <button
                onClick={onPrevious}
                disabled={currentIndex === 0 || submitting}
                className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Previous
            </button>
            <div className="flex gap-3">
                {isLastQuestion ? (
                    <button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-75"
                    >
                        {submitting ? "Submitting..." : "Submit Quiz"}
                    </button>
                ) : (
                    <button
                        onClick={onNext}
                        disabled={submitting}
                        className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm disabled:opacity-50"
                    >
                        Next Question
                    </button>
                )}
            </div>
        </div>
    );
}

function QuizNavigation({
    answers,
    currentIndex,
    questions,
    onJump,
}: Readonly<{
    answers: AnswerMap;
    currentIndex: number;
    questions: Question[];
    onJump: (index: number) => void;
}>) {
    return (
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quiz Navigation</h3>
            <div className="flex flex-wrap gap-3">
                {questions.map((question, index) => (
                    <button
                        key={question.id}
                        onClick={() => onJump(index)}
                        className={`w-12 h-12 rounded-xl font-bold transition-all ${getNavigationButtonClass(currentIndex === index, !!answers[question.id])}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}

function AnswerBreakdown({ details }: Readonly<{ details: QuizResultDetail[] }>) {
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider px-1">
                Answer Breakdown
            </h3>
            {details.map((detail, index) => (
                <AnswerReviewCard key={detail.questionId} detail={detail} index={index} />
            ))}
        </div>
    );
}

function AnswerReviewCard({ detail, index }: Readonly<{ detail: QuizResultDetail; index: number }>) {
    const styles = getReviewCardStyles(detail.correct);

    return (
        <div className={`rounded-2xl border p-5 ${styles.card}`}>
            <div className="flex items-start gap-3 mb-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${styles.marker}`}>
                    {index + 1}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {detail.questionType.replace("_", " ")}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                            {detail.correct ? "Correct" : "Incorrect"}
                        </span>
                    </div>
                    <p className="font-semibold text-slate-800 leading-snug">{detail.questionText}</p>
                </div>
            </div>

            <div className="space-y-2 pl-11">
                {detail.options && detail.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {detail.options.map((opt) => {
                            const isCorrect = opt.trim().toUpperCase() === detail.correctAnswer?.trim().toUpperCase();
                            const isUserAnswer = opt.trim().toUpperCase() === detail.userAnswer?.trim().toUpperCase();
                            return (
                                <span
                                    key={opt}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium border ${getAnswerOptionClass(isCorrect, isUserAnswer)}`}
                                >
                                    {opt}
                                    {isCorrect && " Correct"}
                                    {isUserAnswer && !isCorrect && " Incorrect"}
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-white rounded-xl px-4 py-2.5 border border-slate-200">
                        <p className="text-xs text-slate-400 mb-0.5">Your answer</p>
                        <p className={`font-semibold text-sm ${styles.answer}`}>
                            {detail.userAnswer ?? <span className="italic text-slate-400">No answer</span>}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-2.5 border border-emerald-200">
                        <p className="text-xs text-slate-400 mb-0.5">Correct answer</p>
                        <p className="font-semibold text-sm text-emerald-600">{detail.correctAnswer}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CompletedIcon({ className = "w-8 h-8" }: Readonly<{ className?: string }>) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function WarningIcon() {
    return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}

function formatTime(seconds: number) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
    const s = (safeSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function formatCompletedDate(completedAt: string) {
    return new Date(completedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function normalizeAccuracy(accuracy: number) {
    return accuracy <= 1 ? accuracy * 100 : accuracy;
}

function getScoreStyles(score: number) {
    if (score >= 80) {
        return {
            scoreColor: "text-emerald-600",
            scoreBg: "bg-emerald-50 border-emerald-200",
        };
    }

    if (score >= 60) {
        return {
            scoreColor: "text-amber-500",
            scoreBg: "bg-amber-50 border-amber-200",
        };
    }

    return {
        scoreColor: "text-rose-500",
        scoreBg: "bg-rose-50 border-rose-200",
    };
}

function getTrueFalseOptionClass(selected: boolean, option: string) {
    if (!selected) {
        return "border-slate-200 hover:border-slate-300";
    }

    if (option.toLowerCase() === "true") {
        return "border-emerald-500 bg-emerald-50";
    }

    return "border-rose-500 bg-rose-50";
}

function getReviewCardStyles(isCorrect: boolean) {
    return {
        card: isCorrect ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
        marker: isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white",
        badge: isCorrect ? "bg-emerald-200 text-emerald-700" : "bg-rose-200 text-rose-700",
        answer: isCorrect ? "text-emerald-600" : "text-rose-600",
    };
}

function getAnswerOptionClass(isCorrect: boolean, isUserAnswer: boolean) {
    if (isCorrect) {
        return "bg-emerald-100 border-emerald-400 text-emerald-700";
    }

    if (isUserAnswer) {
        return "bg-rose-100 border-rose-400 text-rose-700";
    }

    return "bg-white border-slate-200 text-slate-500";
}

function getNavigationButtonClass(active: boolean, answered: boolean) {
    if (active) {
        return "bg-indigo-600 text-white";
    }

    if (answered) {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-slate-100 text-slate-500 hover:bg-slate-200";
}

function getOptionLetter(index: number) {
    return String.fromCodePoint(65 + index);
}
