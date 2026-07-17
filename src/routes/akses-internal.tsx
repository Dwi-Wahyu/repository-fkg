import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { yupValidator } from "@tanstack/yup-form-adapter";
import { Lock, LogIn } from "lucide-react";
import * as yup from "yup";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/useToast";
import {
	getInternalAccessStatusFn,
	internalLoginFn,
} from "../server/internalAuthFunctions";

export const Route = createFileRoute("/akses-internal")({
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: (search.redirect as string) || undefined,
	}),
	beforeLoad: async ({ search }) => {
		const access = await getInternalAccessStatusFn();
		if (access.granted) {
			throw redirect({
				to: search.redirect || "/",
			});
		}
	},
	component: AksesInternalComponent,
});

function AksesInternalComponent() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const { toast } = useToast();

	const form = useForm({
		defaultValues: {
			username: "",
			password: "",
		},
		validatorAdapter: yupValidator(),
		onSubmit: async ({ value }) => {
			try {
				await internalLoginFn({ data: value });
				toast({
					title: "Login berhasil",
					description: "Akses internal telah diberikan.",
				});
				navigate({
					to: search.redirect || "/",
				});
			} catch (error: unknown) {
				toast({
					title: "Login gagal",
					description: error instanceof Error ? error.message : "Terjadi kesalahan sistem.",
					variant: "destructive",
				});
			}
		},
	});

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
			<Card className="w-full max-w-md shadow-lg border-0 bg-white">
				<CardHeader className="space-y-2 text-center pb-6 border-b border-gray-100">
					<div className="mx-auto bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mb-2">
						<Lock className="w-6 h-6 text-indigo-600" />
					</div>
					<CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
						Login Komputer Internal
					</CardTitle>
					<CardDescription className="text-gray-500 text-sm max-w-xs mx-auto">
						Khusus komputer di lingkungan Perpustakaan FKG Unhas untuk membuka
						akses baca dokumen.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-6">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-5"
					>
						<form.Field
							name="username"
							validators={{
								onChange: yup.string().required("Username wajib diisi"),
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name} className="text-gray-700">
										Username
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Masukkan username"
										className={`h-11 ${field.state.meta.errors.length > 0 ? "border-red-500 focus-visible:ring-red-500" : ""}`}
									/>
									{field.state.meta.errors ? (
										<p className="text-sm text-red-500 font-medium">
											{field.state.meta.errors.join(", ")}
										</p>
									) : null}
								</div>
							)}
						</form.Field>

						<form.Field
							name="password"
							validators={{
								onChange: yup.string().required("Password wajib diisi"),
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor={field.name} className="text-gray-700">
											Password
										</Label>
									</div>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="••••••••"
										className={`h-11 ${field.state.meta.errors.length > 0 ? "border-red-500 focus-visible:ring-red-500" : ""}`}
									/>
									{field.state.meta.errors ? (
										<p className="text-sm text-red-500 font-medium">
											{field.state.meta.errors.join(", ")}
										</p>
									) : null}
								</div>
							)}
						</form.Field>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									className="w-full h-11 text-base font-medium transition-all"
									disabled={!canSubmit || isSubmitting}
								>
									{isSubmitting ? (
										<div className="flex items-center justify-center gap-2">
											<div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
											<span>Memproses...</span>
										</div>
									) : (
										<div className="flex items-center justify-center gap-2">
											<LogIn className="w-5 h-5" />
											<span>Masuk</span>
										</div>
									)}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
