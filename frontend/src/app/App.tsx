import { AuthProvider } from "@/app/providers/AuthProvider";
import { AppRouter } from "@/app/router";
import { ToastProvider } from "@/shared/ui/Toast";

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
