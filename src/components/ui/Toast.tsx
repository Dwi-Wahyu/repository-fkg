import { useEffect, useState } from "react";
import { useToast } from "./useToast";

export function ToastContainer() {
	const { toasts, toast } = useToast();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) return null;

	return (
		<div className="toast-container">
			{toasts.map((t) => (
				<div
					key={t.id}
					className={`toast toast-${t.type} bg-white! text-slate-900! border-l-4 border-l-primary border-slate-200 shadow-xl`}
				>
					<span className="toast-message text-slate-900! font-medium">{t.message}</span>
					<button
						type="button"
						className="toast-close text-slate-400! hover:text-slate-700! transition-colors"
						onClick={() => toast.dismiss(t.id)}
						aria-label="Dismiss toast"
					>
						&times;
					</button>
				</div>
			))}
		</div>
	);
}
