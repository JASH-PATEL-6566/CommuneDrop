import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md space-y-6">
          <LoginForm />
          <p className="text-center text-xs text-gray-500">
            Zip through your city with CommuneDrop – lightning-fast, reliable
            rides at your fingertips. Ready to roll? Get started now! By
            continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
