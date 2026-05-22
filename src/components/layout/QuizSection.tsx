type QuizSectionProps = Readonly<{
    onStart?: () => void;
    isCompleted?: boolean;
    onShowResult?: () => void;
    loadingResult?: boolean;
}>;

function getButtonContent(loadingResult?: boolean, isCompleted?: boolean) {
    if (loadingResult) {
        return (
            <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
            </>
        );
    }

    if (isCompleted) {
        return (
            <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Show Result
            </>
        );
    }

    return (
        <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Quiz
        </>
    );
}

export default function QuizSection({ onStart,
                                        isCompleted,
                                        onShowResult,
                                        loadingResult,
                                    }: QuizSectionProps) {
    const title = isCompleted ? "Quiz Completed!" : "Finish reading?";
    const description = isCompleted
        ? "You have already taken the quiz for this reading."
        : "Let's test your knowledge by taking this quiz.";

    return (
        <div className="mt-12 p-8 bg-green-50 rounded-2xl text-center">
            <h4 className="font-bold text-green-900 mb-2">
                {title}
            </h4>

            <p className="text-green-700 mb-6 text-sm">
                {description}
            </p>

            <button
                onClick={isCompleted ? onShowResult : onStart}
                disabled={loadingResult}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
                {getButtonContent(loadingResult, isCompleted)}
            </button>
        </div>
    );
}
