import RegisterForm from "../components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-6">Daftar Akun Guru</h1>
      <RegisterForm />
    </div>
  );
}