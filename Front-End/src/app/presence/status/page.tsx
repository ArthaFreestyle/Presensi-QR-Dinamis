"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, User, Clock, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AVAILABLE_COURSES, AVAILABLE_SESSIONS } from "@/config/courses";
import { api } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";

type SessionStatus = {
  sessionId: string;
  status: "checked_in" | "not_checked_in" | "error" | "loading";
  lastTs?: string | null;
};

export default function PresenceStatusPage() {
  const { userId, isConfigured } = useUserId();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [sessionsData, setSessionsData] = useState<SessionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async (courseId: string) => {
    if (!userId) return;
    setIsLoading(true);

    // Initialize with loading state
    const initialData: SessionStatus[] = AVAILABLE_SESSIONS.map(sessionId => ({
      sessionId,
      status: "loading",
    }));
    setSessionsData(initialData);

    // Fetch all sequentially to avoid overwhelming GAS, or Promise.all if it works.
    // GAS can sometimes fail if hit concurrently heavily. We will use Promise.all but map gracefully.
    try {
      const results = await Promise.all(
        AVAILABLE_SESSIONS.map(async (sessionId) => {
          try {
            const res = await api.getPresenceStatus({
              user_id: userId,
              course_id: courseId,
              session_id: sessionId,
            });
            if (res.ok) {
              return {
                sessionId,
                status: res.data.status,
                lastTs: res.data.last_ts,
              } as SessionStatus;
            }
            return { sessionId, status: "error" } as SessionStatus;
          } catch (e) {
             return { sessionId, status: "error" } as SessionStatus;
          }
        })
      );
      
      setSessionsData(results);
    } catch (error) {
      console.error("Failed to fetch sessions data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when course is selected
  useEffect(() => {
    if (selectedCourse && isConfigured) {
      fetchStatus(selectedCourse);
    }
  }, [selectedCourse, isConfigured]);

  if (isConfigured === null) {
      return (
        <main className="mx-auto w-full max-w-2xl px-4 py-8 flex justify-center">
          <Loader2 className="animate-spin text-slate-400" />
        </main>
      );
  }

  if (!isConfigured) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <Card className="border-t-4 border-t-amber-400 shadow-sm bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="text-amber-500 h-5 w-5" /> Belum Konfigurasi
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2 text-base">
              NIM/User ID kamu belum dikonfigurasi. Silakan lakukan setup terlebih dahulu di halaman presensi.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/presence" className="block w-full">
                <Button className="w-full">Ke Halaman Presensi</Button>
             </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const presentsCount = sessionsData.filter(s => s.status === "checked_in").length;
  const totalCount = AVAILABLE_SESSIONS.length;
  const progressPercent = (presentsCount / totalCount) * 100;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10 pb-24">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Rekap Presensi</h1>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 w-fit px-3 py-1 rounded-full">
            <User className="h-4 w-4" />
            <span className="font-medium">{userId}</span>
        </div>
      </section>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
           <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Pilih Mata Kuliah
              </label>
              <select 
                className="w-full rounded-md border border-slate-300 px-4 py-3 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="" disabled>Pilih Course...</option>
                {AVAILABLE_COURSES.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.id})
                  </option>
                ))}
              </select>
           </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card>
            <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-lg">Ringkasan Kehadiran</CardTitle>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-600">Total Hadir</span>
                        <span className="text-slate-800">{presentsCount} / {totalCount} Sesi</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out" 
                           style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                    {sessionsData.length === 0 ? (
                        <li className="p-6 text-center text-slate-500">Memuat sesi...</li>
                    ) : (
                        sessionsData.map((session) => (
                            <li key={session.sessionId} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-medium text-slate-700 w-16">
                                        {session.sessionId.replace('sesi-', 'Sesi ')}
                                    </span>
                                    
                                    {session.status === "loading" && (
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                                    )}
                                    {session.status === "checked_in" && (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                                            <CheckCircle2 className="h-4 w-4" /> Hadir
                                        </span>
                                    )}
                                    {session.status === "not_checked_in" && (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                            <XCircle className="h-4 w-4" /> Tidak Hadir
                                        </span>
                                    )}
                                    {session.status === "error" && (
                                        <span className="text-xs text-red-500">Gagal memuat</span>
                                    )}
                                </div>

                                {session.status === "checked_in" && session.lastTs && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(session.lastTs).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
                                    </div>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </CardContent>
        </Card>
      )}
    </main>
  );
}
