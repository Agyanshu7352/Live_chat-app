import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: "var(--background)" }}
        >
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                        style={{ background: "var(--accent)" }}
                    >
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                        ChatFlow
                    </h1>
                    <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                        Real-time messaging for everyone
                    </p>
                </div>
                <SignIn />
            </div>
        </div>
    );
}
