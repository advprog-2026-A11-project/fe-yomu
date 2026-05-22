export interface QuizResultDetail {
    questionId: string;
    questionText: string;
    questionType: string;
    options: string[];
    userAnswer: string | null;
    correctAnswer: string;
    correct: boolean;
}

export interface QuizResult {
    readingId: string;
    score: number;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTakenSeconds?: number;
    completedAt: string;
    questionDetails: QuizResultDetail[];
}

export function QuizScoreSummary({
    result,
    showMedals = false,
    className = "",
}: Readonly<{
    result: QuizResult;
    showMedals?: boolean;
    className?: string;
}>) {
    const { scoreColor, scoreBg } = getScoreStyles(result.score);
    const accuracy = normalizeAccuracy(result.accuracy).toFixed(1);

    return (
        <div className={`rounded-2xl border p-5 ${scoreBg} flex items-center justify-between flex-wrap gap-4 ${className}`}>
            <div className="flex items-center gap-4">
                <div className={`text-5xl font-black ${scoreColor}`}>{result.score}</div>
                <div className="text-sm text-slate-500 leading-relaxed">
                    <div className="font-semibold text-slate-700">
                        {result.correctAnswers} / {result.totalQuestions} correct
                    </div>
                    <div>Accuracy: {accuracy}%</div>
                </div>
            </div>
            {showMedals && <QuizMedals score={result.score} />}
        </div>
    );
}

export function QuizResultMeta({
    completedAt,
    timeTakenSeconds,
}: Readonly<{
    completedAt: string;
    timeTakenSeconds?: number;
}>) {
    const completedDate = formatQuizCompletedDate(completedAt);
    const timeTaken = formatQuizDuration(timeTakenSeconds ?? 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Time Taken</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{timeTaken}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Completed At</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{completedDate}</p>
            </div>
        </div>
    );
}

export function AnswerBreakdown({ details }: Readonly<{ details: QuizResultDetail[] }>) {
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

export function formatQuizDuration(seconds: number) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
}

export function formatQuizCompletedDate(completedAt: string) {
    return new Date(completedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function QuizMedals({ score }: Readonly<{ score: number }>) {
    const medals = [
        { label: "gold", icon: String.fromCodePoint(0x1F947) },
        { label: "silver", icon: String.fromCodePoint(0x1F948) },
        { label: "bronze", icon: String.fromCodePoint(0x1F949) },
    ];

    return (
        <div className="flex gap-2">
            {medals.map((medal, index) => (
                <span key={medal.label} className={`text-2xl transition-opacity ${getMedalOpacity(score, index)}`}>
                    {medal.icon}
                </span>
            ))}
        </div>
    );
}

function AnswerReviewCard({
    detail,
    index,
}: Readonly<{
    detail: QuizResultDetail;
    index: number;
}>) {
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
                {detail.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {detail.options.map((option) => (
                            <AnswerOption key={option} detail={detail} option={option} />
                        ))}
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

function AnswerOption({
    detail,
    option,
}: Readonly<{
    detail: QuizResultDetail;
    option: string;
}>) {
    const isCorrect = option.trim().toUpperCase() === detail.correctAnswer?.trim().toUpperCase();
    const isUserAnswer = option.trim().toUpperCase() === detail.userAnswer?.trim().toUpperCase();

    return (
        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getAnswerOptionClass(isCorrect, isUserAnswer)}`}>
            {option}
            {isCorrect && " Correct"}
            {isUserAnswer && !isCorrect && " Incorrect"}
        </span>
    );
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

function getMedalOpacity(score: number, index: number) {
    let selectedIndex = 2;
    if (score >= 80) {
        selectedIndex = 0;
    } else if (score >= 60) {
        selectedIndex = 1;
    }
    return selectedIndex === index ? "opacity-100" : "opacity-20";
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

function getReviewCardStyles(isCorrect: boolean) {
    return {
        card: isCorrect ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
        marker: isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white",
        badge: isCorrect ? "bg-emerald-200 text-emerald-700" : "bg-rose-200 text-rose-700",
        answer: isCorrect ? "text-emerald-600" : "text-rose-600",
    };
}
