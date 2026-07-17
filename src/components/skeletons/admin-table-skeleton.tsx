import { Skeleton } from "../ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";

export function AdminTableSkeleton() {
	return (
		<div className="space-y-4 w-full">
			<div className="flex items-center justify-between">
				<Skeleton className="h-10 w-64" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<Skeleton className="h-4 w-24" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-32" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-32" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-24" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-16" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: 10 }).map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<TableRow key={index}>
								<TableCell>
									<Skeleton className="h-4 w-32" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-40" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-48" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-6 w-20 rounded-full" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-8 w-8 rounded-md" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-32" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-24" />
				</div>
			</div>
		</div>
	);
}
