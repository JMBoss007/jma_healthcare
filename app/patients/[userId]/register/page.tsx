import Image from "next/image";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import RegisterForm from "@/components/forms/RegisterForm";
import { getPatient, getUser } from "@/lib/actions/patient.actions";

type PageProps = {
  params: Promise<{ userId: string }>;
};

const Register = async ({ params }: PageProps) => {
  // ✅ Next.js 16 fix: params is a Promise
  const { userId } = await params;

  if (!userId) {
    Sentry.captureMessage("register_missing_userId");
    redirect("/");
  }

  const user = await getUser(userId);
  const patient = await getPatient(userId);

  // ✅ Don’t crash if user is null/undefined
  Sentry.captureMessage("user_view_register", {
    level: "info",
    extra: { userId, userName: user?.name ?? "unknown" },
  });

  // If patient already exists, go straight to new appointment
  if (patient) redirect(`/patients/${userId}/new-appointment`);

  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container">
        <div className="sub-container max-w-[860px] flex-1 flex-col py-10">
          {/* If user is missing, still render but avoid crashing */}
          <RegisterForm user={user} />

          <p className="copyright py-12">
            © 2026 JMAX Technical Services Registration
          </p>
        </div>
      </section>

      <Image
        src="/assets/images/register-img.png"
        height={1000}
        width={1000}
        alt="patient"
        className="side-img max-w-[390px]"
      />
    </div>
  );
};

export default Register;
