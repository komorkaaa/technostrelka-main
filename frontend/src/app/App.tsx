import { AuthProvider } from "@/app/providers/AuthProvider";
import { AppRouter } from "@/app/router";

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

