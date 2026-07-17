import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
	checkDocumentAccessFn,
	downloadDocumentFn,
	getDocumentPreviewFn,
} from "../server/submissionFunctions";

export const Route = createFileRoute("/dokumen/$id/preview")({
	beforeLoad: async ({ params }) => {
		const access = await checkDocumentAccessFn();
		if (!access.allowed) {
			throw redirect({
				to: "/akses-internal",
				search: { redirect: `/dokumen/${params.id}/preview` },
			});
		}
	},
	component: DokumenPreviewComponent,
});

function DokumenPreviewComponent() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string>("dokumen.pdf");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let url: string | null = null;
		let mounted = true;

		async function fetchPreview() {
			try {
				const result = await getDocumentPreviewFn({
					data: { id: parseInt(id) },
				});
				if (!mounted) return;

				const byteCharacters = atob(result.base64);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "application/pdf" });

				url = URL.createObjectURL(blob);
				setPreviewUrl(url);
				setFileName(result.fileName);
			} catch (err: any) {
				if (mounted) {
					setError(err.message || "Gagal memuat pratinjau dokumen");
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		fetchPreview();

		return () => {
			mounted = false;
			if (url) {
				URL.revokeObjectURL(url);
			}
		};
	}, [id]);

	const handleDownload = async () => {
		try {
			const result = await downloadDocumentFn({ data: { id: parseInt(id) } });
			const byteCharacters = atob(result.base64);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: result.mimeType });

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err: any) {
			alert(err.message || "Gagal mengunduh dokumen");
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
				<div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
				<p className="text-gray-500">Memuat pratinjau dokumen...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] max-w-md mx-auto text-center px-4">
				<div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
					<AlertCircle className="w-8 h-8" />
				</div>
				<h2 className="text-xl font-bold text-gray-900 mb-2">
					Gagal Memuat Pratinjau
				</h2>
				<p className="text-gray-600 mb-6">{error}</p>
				<Button asChild variant="outline">
					<Link to="/dokumen/$id" params={{ id }}>
						Kembali ke Detail Dokumen
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-4rem)]">
			<div className="flex items-center justify-between p-4 border-b bg-white">
				<div className="flex items-center gap-4">
					<Button asChild variant="ghost" size="icon">
						<Link to="/dokumen/$id" params={{ id }}>
							<ArrowLeft className="w-5 h-5" />
						</Link>
					</Button>
					<h1 className="text-sm md:text-base font-semibold truncate max-w-[200px] md:max-w-md">
						{fileName}
					</h1>
				</div>
				<Button
					onClick={handleDownload}
					variant="outline"
					size="sm"
					className="gap-2"
				>
					<Download className="w-4 h-4" />
					<span className="hidden sm:inline">Unduh</span>
				</Button>
			</div>
			<div className="flex-1 bg-gray-100 overflow-hidden">
				{previewUrl && (
					<object
						data={previewUrl}
						type="application/pdf"
						className="w-full h-full"
					>
						<div className="flex flex-col items-center justify-center h-full p-4 text-center">
							<p className="text-gray-600 mb-4">
								Browser Anda tidak mendukung pratinjau PDF bawaan.
							</p>
							<Button onClick={handleDownload}>Unduh Dokumen PDF</Button>
						</div>
					</object>
				)}
			</div>
		</div>
	);
}
