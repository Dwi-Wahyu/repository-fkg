import { Skeleton } from "../ui/skeleton";

export function DocumentListSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-3">
			{Array.from({ length: 5 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<div
					key={i}
					className="p-5 rounded-2xl border border-border/50 space-y-3"
				>
					<div className="flex gap-2">
						<Skeleton className="h-4 w-16 rounded-full" />
						<Skeleton className="h-4 w-32 rounded-full" />
					</div>
					<Skeleton className="h-5 w-3/4" />
					<Skeleton className="h-5 w-1/2" />
					<Skeleton className="h-3 w-40" />
				</div>
			))}
		</div>
	);
}
