import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";
import { Doctors } from "@/constants";
import { getAppointment } from "@/lib/actions/appointment.actions";
import { getUser } from "@/lib/actions/patient.actions";
import { formatDateTime } from "@/lib/utils";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ appointmentId?: string }>;
};

const RequestSuccess = async ({ params, searchParams }: PageProps) => {
  // ✅ Next 16: params/searchParams are Promises
  const { userId } = await params;
  const sp = searchParams ? await searchParams : {};
  const appointmentId = sp?.appointmentId ?? "";

  if (!userId) {
    Sentry.captureMessage("success_missing_userId");
    redirect("/");
  }

  if (!appointmentId) {
    Sentry.captureMessage("success_missing_appointmentId", {
      level: "warning",
      extra: { userId },
    });
    redirect(`/patients/${userId}/new-appointment`);
  }

  const appointment = await getAppointment(appointmentId);

  if (!appointment) {
    Sentry.captureMessage("success_appointment_not_found", {
      level: "warning",
      extra: { userId, appointmentId },
    });
    redirect(`/patients/${userId}/new-appointment`);
  }

  const doctor = Doctors.find((d) => d.name === appointment.primaryPhysician);

  const user = await getUser(userId);

  // ✅ Never crash if user missing
  Sentry.captureMessage("user_view_appointment_success", {
    level: "info",
    extra: { userId, appointmentId, userName: user?.name ?? null },
  });

  return (
    <div className="flex h-screen max-h-screen px-[5%]">
      <div className="success-img">
        <Link href="/">
          <Image
            src="/assets/icons/logo.png"
            height={1000}
            width={1000}
            alt="logo"
            className="h-10 w-fit"
          />
        </Link>

        <section className="flex flex-col items-center">
          <Image
            src="/assets/gifs/success.gif"
            height={300}
            width={280}
            alt="success"
          />
          <h2 className="header mb-6 max-w-[600px] text-center">
            Your <span className="text-green-500">application request</span> has
            been successfully submitted!
          </h2>
          <p>We&apos;ll be in touch shortly to confirm.</p>
        </section>

        <section className="request-details">
          <p>Requested appointment details: </p>
          <div className="flex items-center gap-3">
            For <p className="whitespace-nowrap">{doctor?.name ?? "Service"}</p>
          </div>

          <div className="flex gap-2">
            <Image
              src="/assets/icons/calendar.svg"
              height={24}
              width={24}
              alt="calendar"
            />
            <p>{formatDateTime(appointment.schedule).dateTime}</p>
          </div>
        </section>

        <Button variant="outline" className="shad-primary-btn" asChild>
          <Link href={`/patients/${userId}/new-appointment`}>New Appointment</Link>
        </Button>

        <p className="copyright">© 2026 JMAX Technical Services Registration</p>
      </div>
    </div>
  );
};

export default RequestSuccess;
