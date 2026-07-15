import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { yupValidator } from "@tanstack/yup-form-adapter";
import { useState } from "react";
import * as yup from "yup";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "../components/ui/useToast";
import { getSessionFn, loginFn } from "../server/authFunctions";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getSessionFn();
    if (user) {
      if (user.role === "admin") {
        throw redirect({ to: "/admin" });
      }
      throw redirect({ to: "/" });
    }
  },
  component: LoginComponent,
});

const loginSchema = yup.object().shape({
  username: yup.string().required("Username wajib diisi"),
  password: yup.string().required("Password wajib diisi"),
});

function LoginComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validatorAdapter: yupValidator(),
    validators: {
      onSubmitAsync: loginSchema,
    },
    onSubmit: async ({ value }: { value: any }) => {
      setLoading(true);
      try {
        const response = await loginFn({ data: value });

        if (response.success) {
          toast.success(`Selamat datang kembali, ${response.user.username}!`);
          await router.invalidate();
          router.navigate({ to: "/admin" });
        }
      } catch (err) {
        const error = err as any;
        toast.error(error.message || "Username atau password salah");
      } finally {
        setLoading(false);
      }
    },
  } as any);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <Card className="w-full max-w-[420px] bg-card/60 border-border backdrop-blur-xl relative z-10 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <span className="bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-650 dark:text-indigo-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-indigo-500/20">
              Perpustakaan FKG Unhas
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Login Admin
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Masuk untuk mengelola bebas pustaka mahasiswa
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <CardContent className="space-y-4">
            <form.Field
              name="username"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-foreground">
                      Username
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder="Masukkan username"
                      value={field.state.value as any}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={loading}
                      aria-invalid={isInvalid}
                      className="bg-background/40 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                    />
                    {isInvalid && (
                      <p className="text-xs text-rose-500 mt-1">
                        {field.state.meta.errors
                          .map((error: any) =>
                            typeof error === "string"
                              ? error
                              : error?.message || String(error),
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                );
              }}
            />

            <form.Field
              name="password"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-foreground">
                      Password
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      placeholder="Masukkan password"
                      value={field.state.value as any}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={loading}
                      aria-invalid={isInvalid}
                      className="bg-background/40 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                    />
                    {isInvalid && (
                      <p className="text-xs text-rose-500 mt-1">
                        {field.state.meta.errors
                          .map((error: any) =>
                            typeof error === "string"
                              ? error
                              : error?.message || String(error),
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                );
              }}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer mt-4 h-12"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
            <div className="w-full border-t border-border pt-4 text-center">
              <p className="text-muted-foreground text-xs mb-2">
                Kredensial Admin default:
              </p>
              <div className="inline-block text-[11px] text-muted-foreground bg-card/20 py-1.5 px-3 rounded border border-border">
                <span>
                  Username: <strong className="text-foreground">admin</strong>{" "}
                  &nbsp;|&nbsp; Password:{" "}
                  <strong className="text-foreground">admin123</strong>
                </span>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
