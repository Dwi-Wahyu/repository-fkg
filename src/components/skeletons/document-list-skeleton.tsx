import { Skeleton } from "../ui/skeleton";

export function DocumentListSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: 6 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
				<div
					key={i}
					className="bg-white border border-[#e6bdb7] rounded-xl overflow-hidden shadow-sm flex flex-col"
				>
					<Skeleton className="h-32 w-full rounded-none" />
					<div className="p-5 flex flex-col flex-grow space-y-3">
						<div className="flex items-center gap-2 mb-1">
							<Skeleton className="h-4 w-14 rounded-full" />
							<Skeleton className="h-4 w-28" />
						</div>
						<Skeleton className="h-6 w-5/6" />
						<Skeleton className="h-4 w-2/3" />
						<div className="mt-auto flex justify-between items-center border-t border-[#e6bdb7] pt-4">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

