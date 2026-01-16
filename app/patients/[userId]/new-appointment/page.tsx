import Image from "next/image";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { getPatient } from "@/lib/actions/patient.actions";

type PageProps = {
  params: Promise<{ userId: string }>;
};

const Appointment = async ({ params }: PageProps) => {
  const { userId } = await params;

  if (!userId) {
    Sentry.captureMessage("new_appointment_missing_userId");
    redirect("/");
  }

  const patient = await getPatient(userId);

  // If register didn't create a patient doc yet, send them back
  if (!patient) {
    Sentry.captureMessage("new_appointment_patient_not_found", {
      level: "warning",
      extra: { userId },
    });
    redirect(`/patients/${userId}/register`);
  }

  // don't access patient.name unless patient exists
  Sentry.captureMessage("user_view_new_appointment", {
    level: "info",
    extra: { userId, patientName: patient?.name },
  });

  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container">
        <div className="sub-container max-w-[860px] flex-1 flex-col py-10">
          <AppointmentForm userId={userId} patientId={patient.$id} type="create" />
          <p className="copyright py-12">© 2026 JMAX Technical Services</p>
        </div>
      </section>

      <Image
        src="/assets/images/appointment-img.png"
        height={1000}
        width={1000}
        alt="appointment"
        className="side-img max-w-[390px]"
      />
    </div>
  );
};

export default Appointment;
