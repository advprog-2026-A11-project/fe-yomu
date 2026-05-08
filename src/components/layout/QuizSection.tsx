export default function StartQuizSection({onStart,}: {
    onStart?: () => void;
}) {
    return (
        <div className="mt-12 p-8 bg-green-50 rounded-2xl text-center">
            <h4 className="font-bold text-green-900 mb-2">
                Finish reading?
            </h4>

            <p className="text-green-700 mb-6 text-sm">
                Let's test your knowledge by taking this quiz.
            </p>

            <button
                onClick={onStart}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg active:scale-95"
            >
                Start Quiz
            </button>
        </div>
    );
}