export default function QuranLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 pb-20">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-50 bg-primary-900/80 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <div className="w-20 h-10 bg-white/10 rounded-xl animate-pulse"></div>
                    <div className="w-48 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Skeleton */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="md:col-span-2 bg-white/5 rounded-3xl p-8 h-64 animate-pulse"></div>
                        <div className="bg-white/5 rounded-3xl p-6 h-64 animate-pulse"></div>
                    </div>

                    {/* Surah List Skeleton */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                        <div className="flex justify-between mb-6">
                            <div className="w-48 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                            <div className="w-64 h-10 bg-white/10 rounded-xl animate-pulse"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse border border-white/5"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
