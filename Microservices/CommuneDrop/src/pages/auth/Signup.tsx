import SignUpForm from "../../components/auth/SignupForm";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-md space-y-6">
            <SignUpForm />
            <div className="text-center text-xs text-gray-500">
                <p>Your safety is our priority - 24/7 ride monitoring</p>
                <p className="mt-2">
                By creating an account, you agree to our{" "}
                <a href="/terms" className="hover:underline">Terms of Service</a> and{" "}
                <a href="/privacy" className="hover:underline">Privacy Policy</a>.
                </p>
            </div>
            </div>
        </div>
        </div>
    );
}