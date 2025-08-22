import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-4xl font-bold">You Don't Know React Query</h1>
      <Link
        href="/use-query-on-success-deprecation"
        className="text-blue-500 hover:text-blue-700"
      >
        useQuery onSuccess deprecation
      </Link>
    </div>
  );
}
