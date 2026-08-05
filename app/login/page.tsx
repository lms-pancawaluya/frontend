import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <LoginForm />
    </div>
  );
}