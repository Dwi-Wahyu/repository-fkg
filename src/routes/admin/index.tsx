import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { programStudiMap } from "../../server/db/schema";
import { getDashboardStatsFn } from "../../server/submissionFunctions";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    return await getDashboardStatsFn();
  },
  component: DashboardComponent,
});

const shortProdiMap: Record<string, string> = {
  s1_gigi: "S1 Gigi",
  profesi_gigi: "Profesi",
  ppdgs_prostodonsia: "Pros",
  ppdgs_konservasi: "Kons",
  ppdgs_periodonsia: "Perio",
  ppdgs_bedah_mulut: "BM",
  ppdgs_ortodonsia: "Orto",
  ppdgs_anak: "KGA",
  ppdgs_radiologi: "Rad",
  ppdgs_penyakit_mulut: "PM",
  s2_gigi: "S2 Gigi",
  s3_gigi: "S3 Gigi",
};

// Custom tooltip for prodi chart to show full program studi names
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-xs space-y-1">
        <p className="font-bold text-foreground">
          {payload[0].payload.fullName}
        </p>
        <p className="text-indigo-650 dark:text-indigo-400 font-semibold">
          Jumlah: {payload[0].value} pengajuan
        </p>
      </div>
    );
  }
  return null;
};

function DashboardComponent() {
  const stats = Route.useLoaderData();

  // Format data for Prodi BarChart
  const prodiChartData = stats.prodiBreakdown.map((item: any) => ({
    name: shortProdiMap[item.programStudi] || item.programStudi,
    fullName:
      programStudiMap[item.programStudi as keyof typeof programStudiMap] ||
      item.programStudi,
    count: item.count,
  }));

  return (
    <div className="space-y-8 text-foreground">
      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Dashboard Ringkasan
          </h2>
          <p className="text-muted-foreground mt-1">
            Pantau statistik terkini pengajuan bebas pustaka FKG Unhas.
          </p>
        </div>
        <Button asChild className="cursor-pointer">
          <Link to="/admin/pengajuan" search={{}}>
            Lihat Semua Pengajuan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Top Cards row - 4 Colored Cards (referensi-ui.webp styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Total Pengajuan */}
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Total Pengajuan
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.total}
            </h3>
            <span className="text-[10px] text-muted-foreground block font-medium">
              Seluruh berkas terdaftar
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* 2. Menunggu Verifikasi */}
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Menunggu
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.pending}
            </h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">
              Dalam antrean verifikasi
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* 3. Terverifikasi */}
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Terverifikasi
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.diverifikasi}
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
              Lolos bebas pustaka
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* 4. Ditolak */}
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
              Ditolak
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.ditolak}
            </h3>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-medium">
              Perlu perbaikan berkas
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-2xl">
            <XCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Program Studi */}
        <Card className="bg-card/40 border-border rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle className="text-base font-bold">
                  Sebaran Program Studi
                </CardTitle>
                <CardDescription className="text-xs">
                  Jumlah pengajuan per program studi studi FKG
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prodiChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#prodiGradient)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  >
                    <defs>
                      <linearGradient
                        id="prodiGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop
                          offset="100%"
                          stopColor="#818cf8"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Line/Area Chart: Monthly Trend */}
        <Card className="bg-card/40 border-border rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle className="text-base font-bold">
                  Tren Pengajuan Bulanan
                </CardTitle>
                <CardDescription className="text-xs">
                  Jumlah pengajuan bebas pustaka 6 bulan terakhir
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.monthlyTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      borderColor: "var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "var(--color-popover-foreground)",
                    }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Jumlah Pengajuan"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#trendGradient)"
                  >
                    <defs>
                      <linearGradient
                        id="trendGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
