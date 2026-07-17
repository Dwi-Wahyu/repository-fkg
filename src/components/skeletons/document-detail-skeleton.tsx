import { Skeleton } from "../ui/skeleton";

export function DocumentDetailSkeleton() {
	return (
		<div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-background text-foreground">
			<div className="max-w-4xl w-full mx-auto px-4 py-8 md:py-12 relative z-10 flex-1">
				<div className="mb-6">
					<Skeleton className="h-9 w-40" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
					<div className="md:col-span-2 border border-border/80 bg-card/40 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden p-6 space-y-6">
						<div className="space-y-3 pb-4 border-b border-border/40">
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-20 rounded-full" />
								<Skeleton className="h-4 w-32" />
							</div>
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-2/3" />
						</div>
						<div className="space-y-6">
							<div className="flex items-start gap-3">
								<Skeleton className="h-10 w-10 rounded-xl" />
								<div className="space-y-2">
									<Skeleton className="h-3 w-24" />
									<Skeleton className="h-5 w-48" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
							<div className="flex items-start gap-3">
								<Skeleton className="h-10 w-10 rounded-xl" />
								<div className="space-y-2">
									<Skeleton className="h-3 w-24" />
									<Skeleton className="h-5 w-40" />
								</div>
							</div>
							<div className="flex items-start gap-3">
								<Skeleton className="h-10 w-10 rounded-xl" />
								<div className="space-y-2">
									<Skeleton className="h-3 w-32" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-5/6" />
								</div>
							</div>
						</div>
					</div>
					<div className="border border-border/80 bg-card/45 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden p-6 space-y-4">
						<div className="space-y-2 pb-3 border-b border-border/40">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-3 w-full" />
						</div>
						<div className="space-y-3">
							<Skeleton className="h-16 w-full rounded-xl" />
							<Skeleton className="h-11 w-full rounded-xl" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
