import prisma from "@/lib/prisma";
import RegisterForm from "./form";

type PageProps = {
  params: {
    token: string;
  };
};

export default async function Page({ params }: PageProps) {
  const { token } = await params;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Invalid or missing invite token</p>
      </div>
    );
  }

  const invite = await prisma.userInvite.findUnique({
    where: { token },
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive">Invalid invite token</p>
          <p className="text-sm text-muted-foreground">
            This invitation link may be incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive">This invitation link has expired</p>
          <p className="text-sm text-muted-foreground">
            Please request a new invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RegisterForm
      token={token}
      inviteData={{
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        roleName: invite.role.name,
      }}
    />
  );
}

export const metadata = { title: "Register" };
